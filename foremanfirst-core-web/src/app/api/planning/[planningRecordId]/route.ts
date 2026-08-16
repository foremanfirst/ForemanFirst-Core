import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
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

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const record =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
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

    const body =
      await request.json();

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
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
      toNullableString(
        body.tenantId,
      ) ?? existing.tenantId;

    if (
      tenantId !== existing.tenantId
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

    const [
      company,
      project,
      contractor,
    ] = await Promise.all([
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
      contractorId &&
      !contractor
    ) {
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

    const nextStatus =
      toNullableString(
        body.status,
      ) ?? existing.status;

    const record =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.planningRecord.update({
              where: {
                id: planningRecordId,
              },

              data: {
                companyId,
                projectId,
                contractorId,

                planType:
                  body.planType !== undefined
                    ? toNullableString(
                        body.planType,
                      ) ?? undefined
                    : undefined,

                title:
                  body.title !== undefined
                    ? toNullableString(
                        body.title,
                      ) ?? undefined
                    : undefined,

                status: nextStatus,

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

                workLocation:
                  body.workLocation !== undefined
                    ? toNullableString(
                        body.workLocation,
                      )
                    : undefined,

                crewSize:
                  body.crewSize !== undefined
                    ? toNullableInt(
                        body.crewSize,
                      )
                    : undefined,

                shift:
                  body.shift !== undefined
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
                  body.requiredPpe !== undefined
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
                  body.qualityScore !== undefined
                    ? toNullableInt(
                        body.qualityScore,
                      ) ?? 0
                    : undefined,

                updatedBy:
                  body.updatedBy !== undefined
                    ? toNullableString(
                        body.updatedBy,
                      )
                    : undefined,
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

          if (
            nextStatus !== existing.status
          ) {
            await tx.planningEvent.create({
              data: {
                tenantId,
                planningRecordId,

                eventType:
                  "Planning Status Changed",

                previousStatus:
                  existing.status,

                newStatus:
                  nextStatus,

                revisionNumber:
                  existing.revisionNumber,

                actorId:
                  toNullableString(
                    body.updatedBy,
                  ),

                actorName:
                  toNullableString(
                    body.updatedByName,
                  ),

                actorRole:
                  toNullableString(
                    body.updatedByRole,
                  ),

                comment:
                  toNullableString(
                    body.statusChangeComment,
                  ),
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