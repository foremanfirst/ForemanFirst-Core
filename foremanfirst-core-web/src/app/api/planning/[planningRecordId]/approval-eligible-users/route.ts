import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  resolvePlanningApprovalRouting,
} from "@/lib/planning/approval-routing";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type EligibleApprovalUser = {
  userId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;

  tenantMembershipId: string;
  projectMembershipId: string;

  roleCodes: string[];
  approvalRoleCodes: string[];

  canReviewPlanning: boolean;
  canApprovePlanning: boolean;
  canManagePlanning: boolean;
};

function normalizeRoleCode(
  value: unknown,
) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function uniqueStrings(
  values: string[],
) {
  return [
    ...new Set(
      values
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

/**
 * GET
 * /api/planning/[planningRecordId]/approval-eligible-users
 *
 * Returns eligible Qoreva users for each formal downstream
 * Planning approval role on the current Planning record.
 *
 * Eligibility requires:
 *
 * - same tenant
 * - same project
 * - active User
 * - active TenantMembership
 * - active ProjectMembership
 * - canApprovePlanning = true
 * - approvalRoleCodes contains the required workflow role
 *
 * Important:
 *
 * Step 7 Pre-Submission Review does NOT automatically assign
 * the downstream Step 8 reviewer.
 *
 * This endpoint identifies eligible people only.
 * It does not assign an approver and does not make a decision.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord
              .tenantId,
          projectId:
            authorization.planningRecord
              .projectId,
          isArchived: false,
        },
        select: {
          id: true,
          tenantId: true,
          projectId: true,
          revisionNumber: true,
          status: true,
        },
      });

    if (!planningRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const routing =
      await resolvePlanningApprovalRouting(
        planningRecord.id,
      );

    /**
     * Keep routing tied to the same active Planning revision
     * returned by the Planning record query.
     */
    if (
      routing.revisionNumber !==
      planningRecord.revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "Planning approval routing is not aligned with the active revision.",
        },
        {
          status: 409,
        },
      );
    }

    const requiredRoleCodes =
      uniqueStrings(
        routing.roles
          .filter(
            (role) =>
              role.required,
          )
          .map(
            (role) =>
              normalizeRoleCode(
                role.code,
              ),
          ),
      );

    /**
     * Load the active Planning approval population for this
     * tenant/project once.
     *
     * Role matching is performed below in application code so
     * workflow-role normalization remains deterministic.
     */
    const memberships =
      await prisma.projectMembership.findMany({
        where: {
          tenantId:
            planningRecord.tenantId,

          projectId:
            planningRecord.projectId,

          isActive: true,

          canApprovePlanning: true,

          tenantMembership: {
            tenantId:
              planningRecord.tenantId,

            isActive: true,

            user: {
              isActive: true,
              status: "Active",
            },
          },
        },

        select: {
          id: true,

          roleCodes: true,
          approvalRoleCodes: true,

          canReviewPlanning: true,
          canApprovePlanning: true,
          canManagePlanning: true,

          tenantMembership: {
            select: {
              id: true,

              user: {
                select: {
                  id: true,
                  displayName: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

    const eligiblePopulation =
      memberships
        .map(
          (
            membership,
          ): EligibleApprovalUser => {
            const user =
              membership
                .tenantMembership
                .user;

            return {
              userId:
                user.id,

              displayName:
                user.displayName,

              firstName:
                user.firstName,

              lastName:
                user.lastName,

              email:
                user.email,

              phone:
                user.phone,

              tenantMembershipId:
                membership
                  .tenantMembership
                  .id,

              projectMembershipId:
                membership.id,

              roleCodes:
                membership.roleCodes,

              approvalRoleCodes:
                membership
                  .approvalRoleCodes,

              canReviewPlanning:
                membership
                  .canReviewPlanning,

              canApprovePlanning:
                membership
                  .canApprovePlanning,

              canManagePlanning:
                membership
                  .canManagePlanning,
            };
          },
        )
        .sort((a, b) =>
          a.displayName.localeCompare(
            b.displayName,
          ),
        );

    const roles =
      routing.roles.map(
        (role) => {
          const roleCode =
            normalizeRoleCode(
              role.code,
            );

          const eligibleUsers =
            eligiblePopulation.filter(
              (user) =>
                user.approvalRoleCodes
                  .map(
                    normalizeRoleCode,
                  )
                  .includes(
                    roleCode,
                  ),
            );

          return {
            roleCode,

            roleLabel:
              role.label,

            isRequired:
              role.required,

            sortOrder:
              role.order,

            sourceType:
              role.sourceType,

            sources:
              role.sources,

            configuredSigner: {
              userId:
                role.signerId,

              name:
                role.signerName,

              email:
                role.signerEmail,
            },

            eligibleUserCount:
              eligibleUsers.length,

            assignmentStatus:
              eligibleUsers.length ===
              0
                ? "NoEligibleUsers"
                : eligibleUsers.length ===
                    1
                  ? "SingleEligibleUser"
                  : "MultipleEligibleUsers",

            eligibleUsers,
          };
        },
      );

    const requiredRoles =
      roles.filter(
        (role) =>
          role.isRequired,
      );

    /**
     * This means Qoreva currently has no eligible project member
     * capable of satisfying the required workflow role.
     *
     * A legacy/free-text configured signer does not silently make
     * this eligibility check pass. Step 8B.4B will move formal
     * assignments onto real User identities.
     */
    const unresolvedRequiredRoles =
      requiredRoles.filter(
        (role) =>
          role.eligibleUserCount ===
          0,
      );

    return NextResponse.json({
      planningRecord: {
        id:
          planningRecord.id,

        tenantId:
          planningRecord.tenantId,

        projectId:
          planningRecord.projectId,

        revisionNumber:
          planningRecord.revisionNumber,

        status:
          planningRecord.status,
      },

      routing: {
        resolverVersion:
          routing.metadata
            .resolverVersion,

        applicablePackCount:
          routing.metadata
            .applicablePackCount,

        roleCount:
          roles.length,

        requiredRoleCount:
          requiredRoles.length,

        requiredRoleCodes,
      },

      roles,

      readiness: {
        hasApprovalRoute:
          roles.length > 0,

        hasRequiredApprovalRoute:
          requiredRoles.length >
          0,

        unresolvedRequiredRoleCount:
          unresolvedRequiredRoles.length,

        hasUnresolvedRequiredRoles:
          unresolvedRequiredRoles.length >
          0,

        unresolvedRequiredRoles:
          unresolvedRequiredRoles.map(
            (role) => ({
              roleCode:
                role.roleCode,

              roleLabel:
                role.roleLabel,
            }),
          ),
      },
    });
  } catch (error) {
    if (
      error instanceof
        PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "Unable to load eligible Planning approval users:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "Planning record was not found."
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unable to load eligible Planning approval users.",
      },
      {
        status: 500,
      },
    );
  }
}
