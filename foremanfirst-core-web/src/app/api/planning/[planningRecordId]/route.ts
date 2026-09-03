import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningReaderAuthorizationError,
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

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

const allowedLifecycleTransitions: Record<string, string[]> = {
  Draft: [],
  Submitted: ["In Review"],
  "In Review": ["Revision Needed", "Approved"],
  "Revision Needed": [],
  Approved: ["Closed"],
  Closed: [],
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function toNullableInt(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function toNullableDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function lifecycleEventType(status: string) {
  switch (status) {
    case "In Review":
      return "Planning Review Started";
    case "Revision Needed":
      return "Planning Revision Requested";
    case "Approved":
      return "Planning Record Approved";
    case "Closed":
      return "Planning Record Closed";
    default:
      return "Planning Status Changed";
  }
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningReader(
        planningRecordId,
      );

    const record =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord.tenantId,
          projectId:
            authorization.planningRecord.projectId,
          isArchived: false,
        },

        include: {
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
              clientName: true,
            },
          },

          contractor: {
            select: {
              id: true,
              name: true,
              legalName: true,
              trade: true,
            },
          },

          workSteps: {
            orderBy: {
              sequence: "asc",
            },
          },

          questionResponses: {
            orderBy: [
              {
                category: "asc",
              },
              {
                questionId: "asc",
              },
            ],
          },

          sourceDocuments: {
            orderBy: {
              createdAt: "asc",
            },
          },

          reviews: {
            orderBy: {
              startedAt: "desc",
            },

            include: {
              comments: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },

          reviewComments: {
            orderBy: {
              createdAt: "asc",
            },
          },

          signatures: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },

          revisions: {
            orderBy: {
              revisionNumber: "desc",
            },
          },

          events: {
            orderBy: {
              createdAt: "desc",
            },
            take: 100,
          },

          dailyWseRecords: {
            orderBy: {
              engagementDate: "desc",
            },

            include: {
              tasks: {
                orderBy: {
                  sequence: "asc",
                },
              },

              signatures: {
                orderBy: {
                  createdAt: "asc",
                },
              },

              mocRecords: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

    if (!record) {
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

    return NextResponse.json({
      record,
    });
  } catch (error) {
    if (
      error instanceof
        PlanningReaderAuthorizationError
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
      "Unable to load planning record:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load planning record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord.tenantId,
          projectId:
            authorization.planningRecord.projectId,
          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
          companyId: true,
          projectId: true,
          contractorId: true,
          status: true,
          revisionNumber: true,
          submittedAt: true,
          approvedAt: true,
          activeAt: true,
          effectiveStartDate: true,
          effectiveEndDate: true,
        },
      });

    if (!existing) {
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

    const tenantId =
      authorization.planningRecord.tenantId;

    const requestedTenantId =
      toNullableString(
        body.tenantId,
      );

    if (
      requestedTenantId &&
      requestedTenantId !== tenantId
    ) {
      return NextResponse.json(
        {
          message:
            "Planning record tenant cannot be changed.",
        },
        {
          status: 400,
        },
      );
    }

    const companyId =
      toNullableString(
        body.companyId,
      ) ?? existing.companyId;

    const projectId =
      toNullableString(
        body.projectId,
      ) ?? existing.projectId;

    const contractorWasProvided =
      Object.prototype.hasOwnProperty.call(
        body,
        "contractorId",
      );

    const contractorId =
      contractorWasProvided
        ? toNullableString(
            body.contractorId,
          )
        : existing.contractorId;

    const [company, project, contractor] =
      await Promise.all([
        prisma.company.findFirst({
          where: {
            id: companyId,
            tenantId,
            isArchived: false,
          },
          select: {
            id: true,
          },
        }),

        prisma.project.findFirst({
          where: {
            id: projectId,
            tenantId,
            companyId,
            isArchived: false,
          },
          select: {
            id: true,
          },
        }),

        contractorId
          ? prisma.contractor.findFirst({
              where: {
                id: contractorId,
                tenantId,
                companyId,
                isArchived: false,
              },
              select: {
                id: true,
              },
            })
          : Promise.resolve(null),
      ]);

    if (!company) {
      return NextResponse.json(
        {
          message:
            "Selected company was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          message:
            "Selected project was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      projectId !==
        authorization.planningRecord.projectId
    ) {
      const targetProjectMembership =
        await prisma.projectMembership.findFirst({
          where: {
            tenantId,
            projectId,
            tenantMembershipId:
              authorization.membership.tenantMembershipId,
            isActive: true,
          },

          select: {
            canCreatePlanning: true,
            canManagePlanning: true,
          },
        });

      if (
        !targetProjectMembership ||
        (
          !targetProjectMembership.canCreatePlanning &&
          !targetProjectMembership.canManagePlanning
        )
      ) {
        return NextResponse.json(
          {
            message:
              "You are not authorized to create or manage planning records on the selected project.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (contractorId && !contractor) {
      return NextResponse.json(
        {
          message:
            "Selected contractor was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      body.crewSize !== undefined &&
      body.crewSize !== null &&
      body.crewSize !== ""
    ) {
      const crewSize =
        Number(body.crewSize);

      if (
        !Number.isInteger(crewSize) ||
        crewSize < 1
      ) {
        return NextResponse.json(
          {
            message:
              "Crew size must be a whole number of 1 or greater.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const effectiveStartDateWasProvided =
      Object.prototype.hasOwnProperty.call(
        body,
        "effectiveStartDate",
      );

    const effectiveEndDateWasProvided =
      Object.prototype.hasOwnProperty.call(
        body,
        "effectiveEndDate",
      );

    const nextEffectiveStartDate =
      effectiveStartDateWasProvided
        ? toNullableDate(
            body.effectiveStartDate,
          )
        : existing.effectiveStartDate;

    const nextEffectiveEndDate =
      effectiveEndDateWasProvided
        ? toNullableDate(
            body.effectiveEndDate,
          )
        : existing.effectiveEndDate;

    if (
      effectiveStartDateWasProvided &&
      body.effectiveStartDate &&
      !nextEffectiveStartDate
    ) {
      return NextResponse.json(
        {
          message:
            "Effective start date is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      effectiveEndDateWasProvided &&
      body.effectiveEndDate &&
      !nextEffectiveEndDate
    ) {
      return NextResponse.json(
        {
          message:
            "Effective end date is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      nextEffectiveStartDate &&
      nextEffectiveEndDate &&
      nextEffectiveEndDate <
        nextEffectiveStartDate
    ) {
      return NextResponse.json(
        {
          message:
            "Effective end date cannot be before the effective start date.",
        },
        {
          status: 400,
        },
      );
    }

    const statusWasProvided =
      Object.prototype.hasOwnProperty.call(
        body,
        "status",
      );

    const requestedStatus =
      statusWasProvided
        ? toNullableString(
            body.status,
          )
        : null;

    if (
      statusWasProvided &&
      !requestedStatus
    ) {
      return NextResponse.json(
        {
          message:
            "Planning status cannot be blank.",
        },
        {
          status: 400,
        },
      );
    }

    const nextStatus =
      requestedStatus ??
      existing.status;

    const statusChanged =
      nextStatus !== existing.status;

    const actorName =
      authorization.user.displayName;

    const actorRole =
      authorization.membership.roleCodes.join(
        ", ",
      ) || "Planning Editor";

    if (statusChanged) {
      const allowedNextStatuses =
        allowedLifecycleTransitions[
          existing.status
        ];

      if (
        !allowedNextStatuses ||
        !allowedNextStatuses.includes(
          nextStatus,
        )
      ) {
        return NextResponse.json(
          {
            message: `Invalid planning status transition: ${existing.status} → ${nextStatus}.`,
          },
          {
            status: 409,
          },
        );
      }

      if (
        nextStatus ===
          "Revision Needed" &&
        !toNullableString(
          body.statusChangeComment,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "A revision comment is required when returning a plan for revision.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        nextStatus === "Closed" &&
        !toNullableString(
          body.statusChangeComment,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "A closeout comment is required when closing an approved planning record.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        existing.status === "Submitted" &&
        nextStatus === "In Review"
      ) {
        const [revision, signatureCount] =
          await Promise.all([
            prisma.planningRevision.findFirst({
              where: {
                planningRecordId,
                tenantId,
                revisionNumber:
                  existing.revisionNumber,
              },
              select: {
                id: true,
              },
            }),

            prisma.planningSignature.count({
              where: {
                planningRecordId,
                tenantId,
                revisionNumber:
                  existing.revisionNumber,
                status: "Signed",
                isRequired: true,
              },
            }),
          ]);

        if (!revision) {
          return NextResponse.json(
            {
              message:
                "A persisted planning revision is required before review can begin.",
            },
            {
              status: 409,
            },
          );
        }

        if (signatureCount < 1) {
          return NextResponse.json(
            {
              message:
                "Required submission signatures must be present before review can begin.",
            },
            {
              status: 409,
            },
          );
        }
      }

      if (
        existing.status === "In Review" &&
        nextStatus === "Approved"
      ) {
        const openComments =
          await prisma.planningReviewComment.count({
            where: {
              planningRecordId,
              tenantId,
              revisionNumber:
                existing.revisionNumber,
              status: "Open",
            },
          });

        if (openComments > 0) {
          return NextResponse.json(
            {
              message:
                "Resolve all open review comments before approving the planning record.",
            },
            {
              status: 409,
            },
          );
        }

        if (
          !nextEffectiveStartDate ||
          !nextEffectiveEndDate
        ) {
          return NextResponse.json(
            {
              message:
                "Effective start and end dates are required before approving the planning record.",
            },
            {
              status: 409,
            },
          );
        }
      }
    }

    const transitionTimestamp =
      statusChanged
        ? new Date()
        : null;

    const record =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.planningRecord.update({
              where: {
                id: planningRecordId,
                tenantId,
              },

              data: {
                companyId,
                projectId,
                contractorId,

                planType:
                  body.planType !==
                  undefined
                    ? toNullableString(
                        body.planType,
                      ) ?? undefined
                    : undefined,

                title:
                  body.title !==
                  undefined
                    ? toNullableString(
                        body.title,
                      ) ?? undefined
                    : undefined,

                status:
                  nextStatus,

                responsibleSupervisor:
                  body.responsibleSupervisor !==
                  undefined
                    ? toNullableString(
                        body.responsibleSupervisor,
                      )
                    : undefined,

                responsibleSupervisorId:
                  body.responsibleSupervisorId !==
                  undefined
                    ? toNullableString(
                        body.responsibleSupervisorId,
                      )
                    : undefined,

                plannedStartDate:
                  body.plannedStartDate !==
                  undefined
                    ? toNullableDate(
                        body.plannedStartDate,
                      )
                    : undefined,

                effectiveStartDate:
                  effectiveStartDateWasProvided
                    ? nextEffectiveStartDate
                    : undefined,

                effectiveEndDate:
                  effectiveEndDateWasProvided
                    ? nextEffectiveEndDate
                    : undefined,

                workLocation:
                  body.workLocation !==
                  undefined
                    ? toNullableString(
                        body.workLocation,
                      )
                    : undefined,

                crewSize:
                  body.crewSize !==
                  undefined
                    ? toNullableInt(
                        body.crewSize,
                      )
                    : undefined,

                shift:
                  body.shift !==
                  undefined
                    ? toNullableString(
                        body.shift,
                      )
                    : undefined,

                scopeDescription:
                  body.scopeDescription !==
                  undefined
                    ? toNullableString(
                        body.scopeDescription,
                      )
                    : undefined,

                equipmentTools:
                  body.equipmentTools !==
                  undefined
                    ? toNullableString(
                        body.equipmentTools,
                      )
                    : undefined,

                materialsChemicals:
                  body.materialsChemicals !==
                  undefined
                    ? toNullableString(
                        body.materialsChemicals,
                      )
                    : undefined,

                adjacentWork:
                  body.adjacentWork !==
                  undefined
                    ? toNullableString(
                        body.adjacentWork,
                      )
                    : undefined,

                specialConditions:
                  body.specialConditions !==
                  undefined
                    ? toNullableString(
                        body.specialConditions,
                      )
                    : undefined,

                requiredPpe:
                  body.requiredPpe !==
                  undefined
                    ? toNullableString(
                        body.requiredPpe,
                      )
                    : undefined,

                requiredPermits:
                  body.requiredPermits !==
                  undefined
                    ? toNullableString(
                        body.requiredPermits,
                      )
                    : undefined,

                emergencyPlan:
                  body.emergencyPlan !==
                  undefined
                    ? toNullableString(
                        body.emergencyPlan,
                      )
                    : undefined,

                stopWorkTriggers:
                  body.stopWorkTriggers !==
                  undefined
                    ? toNullableString(
                        body.stopWorkTriggers,
                      )
                    : undefined,

                planningNotes:
                  body.planningNotes !==
                  undefined
                    ? toNullableString(
                        body.planningNotes,
                      )
                    : undefined,

                qualityScore:
                  body.qualityScore !==
                  undefined
                    ? toNullableInt(
                        body.qualityScore,
                      ) ?? 0
                    : undefined,

                submittedAt:
                  nextStatus === "Submitted" &&
                  !existing.submittedAt
                    ? transitionTimestamp
                    : undefined,

                approvedAt:
                  nextStatus === "Approved"
                    ? transitionTimestamp
                    : undefined,

                /*
                 * Deprecated field retained temporarily for compatibility.
                 * Field readiness is now derived from Approved status plus
                 * effectiveStartDate/effectiveEndDate.
                 */
                activeAt:
                  nextStatus === "Approved"
                    ? null
                    : undefined,

                updatedBy:
                  authorization.user.id,
              },

              include: {
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

                contractor: {
                  select: {
                    id: true,
                    name: true,
                    legalName: true,
                    trade: true,
                  },
                },
              },
            });

          if (statusChanged) {
            await tx.planningEvent.create({
              data: {
                tenantId,
                planningRecordId,

                eventType:
                  lifecycleEventType(
                    nextStatus,
                  ),

                previousStatus:
                  existing.status,

                newStatus:
                  nextStatus,

                revisionNumber:
                  existing.revisionNumber,

                actorId:
                  authorization.user.id,

                actorName,

                actorRole,

                comment:
                  toNullableString(
                    body.statusChangeComment,
                  ),

                metadata: {
                  lifecycleTransition:
                    true,
                  from:
                    existing.status,
                  to:
                    nextStatus,
                  effectiveStartDate:
                    nextEffectiveStartDate?.toISOString() ??
                    null,
                  effectiveEndDate:
                    nextEffectiveEndDate?.toISOString() ??
                    null,
                },
              },
            });
          }

          return updated;
        },
      );

    return NextResponse.json({
      record,
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
      "Unable to update planning record:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to update planning record.",
      },
      {
        status: 500,
      },
    );
  }
}