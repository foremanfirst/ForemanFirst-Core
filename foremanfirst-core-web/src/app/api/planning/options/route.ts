import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
} from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    /*
     * Planning option discovery must begin with the authenticated
     * Qoreva identity. Never trust tenant, project, company, or
     * membership identifiers supplied by the browser as proof of
     * access.
     */
    const user =
      await requireCurrentUser();

    /*
     * Discover only active project memberships belonging to this
     * authenticated user where Planning creation or management is
     * explicitly allowed.
     *
     * TenantMembership and ProjectMembership together establish
     * the user's authorized Planning project boundary.
     */
    const memberships =
      await prisma.projectMembership.findMany({
        where: {
          isActive: true,

          OR: [
            {
              canCreatePlanning: true,
            },
            {
              canManagePlanning: true,
            },
          ],

          tenantMembership: {
            userId: user.id,
            isActive: true,
          },

          project: {
            isArchived: false,
            isActive: true,
          },
        },

        select: {
          tenantId: true,
          projectId: true,

          tenantMembership: {
            select: {
              tenantId: true,
            },
          },
        },
      });

    /*
     * Defense in depth:
     *
     * ProjectMembership.tenantId and its parent TenantMembership
     * must describe the same tenant boundary. Ignore malformed
     * cross-tenant membership rows rather than allowing them to
     * widen option discovery.
     */
    const authorizedProjectIds =
      Array.from(
        new Set(
          memberships
            .filter(
              (membership) =>
                membership.tenantId ===
                membership
                  .tenantMembership
                  .tenantId,
            )
            .map(
              (membership) =>
                membership.projectId,
            ),
        ),
      );

    /*
     * A user with no authorized Planning projects receives an
     * empty option set rather than global project/contractor data.
     */
    if (
      authorizedProjectIds.length === 0
    ) {
      return NextResponse.json({
        projects: [],
        contractors: [],
        projectMembers: [],
      });
    }

    const [projects, contractors, projectMemberships] =
      await Promise.all([
        prisma.project.findMany({
          where: {
            id: {
              in: authorizedProjectIds,
            },

            isArchived: false,
            isActive: true,
          },

          select: {
            id: true,
            tenantId: true,
            name: true,
            projectCode: true,
            companyId: true,
            clientName: true,
            status: true,
            location: true,
            city: true,
            state: true,

            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            name: "asc",
          },
        }),

        prisma.contractor.findMany({
          where: {
            projectId: {
              in: authorizedProjectIds,
            },

            isArchived: false,
            isActive: true,
          },

          select: {
            id: true,
            name: true,
            legalName: true,
            contractorCode: true,
            companyId: true,
            projectId: true,
            trade: true,
            approvalStatus: true,
            complianceStatus: true,
            orientationStatus: true,

            company: {
              select: {
                id: true,
                name: true,
              },
            },

            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
              },
            },
          },

          orderBy: {
            name: "asc",
          },
        }),

        /*
         * Project people available for identity-backed Planning
         * assignments such as Responsible Supervisor / Foreman.
         *
         * This is intentionally broader than approval eligibility:
         * the person responsible for field execution does not need
         * approval authority.
         */
        prisma.projectMembership.findMany({
          where: {
            projectId: {
              in: authorizedProjectIds,
            },

            isActive: true,

            tenantMembership: {
              isActive: true,

              user: {
                isActive: true,
                status: "Active",
              },
            },
          },

          select: {
            id: true,
            tenantId: true,
            projectId: true,
            roleCodes: true,

            tenantMembership: {
              select: {
                id: true,
                tenantId: true,

                user: {
                  select: {
                    id: true,
                    displayName: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    /*
     * Final contractor guard:
     *
     * Contractors must belong to a project actually returned by
     * the authorized project query. This prevents malformed or
     * inconsistent records from widening the response.
     */
    const returnedProjectIds =
      new Set(
        projects.map(
          (project) => project.id,
        ),
      );

    const authorizedContractors =
      contractors.filter(
        (contractor) =>
          contractor.projectId !== null &&
          returnedProjectIds.has(
            contractor.projectId,
          ),
      );

    const projectMembers =
      projectMemberships
        .filter(
          (membership) =>
            membership.tenantId ===
              membership
                .tenantMembership
                .tenantId &&
            returnedProjectIds.has(
              membership.projectId,
            ),
        )
        .map((membership) => ({
          userId:
            membership
              .tenantMembership
              .user.id,

          displayName:
            membership
              .tenantMembership
              .user.displayName,

          firstName:
            membership
              .tenantMembership
              .user.firstName,

          lastName:
            membership
              .tenantMembership
              .user.lastName,

          tenantMembershipId:
            membership
              .tenantMembership.id,

          projectMembershipId:
            membership.id,

          projectId:
            membership.projectId,

          roleCodes:
            membership.roleCodes,
        }))
        .sort((a, b) =>
          a.displayName.localeCompare(
            b.displayName,
          ),
        );

    return NextResponse.json({
      projects,
      contractors:
        authorizedContractors,
      projectMembers,
    });
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 401,
        },
      );
    }

    console.error(
      "Planning options load failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load planning assignment options.",
      },
      {
        status: 500,
      },
    );
  }
}
