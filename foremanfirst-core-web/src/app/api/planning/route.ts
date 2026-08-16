import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function GET(
  request: NextRequest,
) {
  try {
    const tenantId =
      toNullableString(
        request.nextUrl.searchParams.get(
          "tenantId",
        ),
      );

    if (!tenantId) {
      return NextResponse.json(
        {
          message:
            "Tenant ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const records =
      await prisma.planningRecord.findMany({
        where: {
          tenantId,
          isArchived: false,
        },

        orderBy: {
          updatedAt: "desc",
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

          _count: {
            select: {
              workSteps: true,
              questionResponses: true,
              reviews: true,
              reviewComments: true,
              signatures: true,
              dailyWseRecords: true,
            },
          },
        },
      });

    return NextResponse.json({
      records,
    });
  } catch (error) {
    console.error(
      "Unable to load planning records:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load planning records.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const tenantId =
      toNullableString(
        body.tenantId,
      );

    const companyId =
      toNullableString(
        body.companyId,
      );

    const projectId =
      toNullableString(
        body.projectId,
      );

    const contractorId =
      toNullableString(
        body.contractorId,
      );

    const planType =
      toNullableString(
        body.planType,
      );

    const title =
      toNullableString(
        body.title,
      );

    if (!tenantId) {
      return NextResponse.json(
        {
          message:
            "Tenant ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        {
          message:
            "Company is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        {
          message:
            "Project is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!planType) {
      return NextResponse.json(
        {
          message:
            "Plan type is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Planning record title is required.",
        },
        {
          status: 400,
        },
      );
    }

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
          isActive: true,
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
          isActive: true,
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
              projectId,
              isArchived: false,
              isActive: true,
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
            "Selected company was not found for this tenant.",
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
            "Selected project was not found for this tenant and company.",
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
            "Selected contractor was not found for this project.",
        },
        {
          status: 404,
        },
      );
    }

    const record =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.planningRecord.create({
              data: {
                tenantId,
                companyId,
                projectId,
                contractorId,

                planType,
                title,

                status: "Draft",
                revisionNumber: 1,

                responsibleSupervisor:
                  toNullableString(
                    body.responsibleSupervisor,
                  ),

                responsibleSupervisorId:
                  toNullableString(
                    body.responsibleSupervisorId,
                  ),

                plannedStartDate:
                  toNullableDate(
                    body.plannedStartDate,
                  ),

                workLocation:
                  toNullableString(
                    body.workLocation,
                  ),

                crewSize:
                  toNullableInt(
                    body.crewSize,
                  ),

                shift:
                  toNullableString(
                    body.shift,
                  ),

                scopeDescription:
                  toNullableString(
                    body.scopeDescription,
                  ),

                equipmentTools:
                  toNullableString(
                    body.equipmentTools,
                  ),

                materialsChemicals:
                  toNullableString(
                    body.materialsChemicals,
                  ),

                adjacentWork:
                  toNullableString(
                    body.adjacentWork,
                  ),

                specialConditions:
                  toNullableString(
                    body.specialConditions,
                  ),

                requiredPpe:
                  toNullableString(
                    body.requiredPpe,
                  ),

                requiredPermits:
                  toNullableString(
                    body.requiredPermits,
                  ),

                emergencyPlan:
                  toNullableString(
                    body.emergencyPlan,
                  ),

                stopWorkTriggers:
                  toNullableString(
                    body.stopWorkTriggers,
                  ),

                planningNotes:
                  toNullableString(
                    body.planningNotes,
                  ),

                qualityScore:
                  toNullableInt(
                    body.qualityScore,
                  ) ?? 0,

                createdBy:
                  toNullableString(
                    body.createdBy,
                  ),

                updatedBy:
                  toNullableString(
                    body.updatedBy,
                  ),
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

          await tx.planningEvent.create({
            data: {
              tenantId,
              planningRecordId:
                created.id,

              eventType:
                "Planning Record Created",

              previousStatus: null,
              newStatus: "Draft",

              revisionNumber: 1,

              actorId:
                toNullableString(
                  body.createdBy,
                ),

              actorName:
                toNullableString(
                  body.createdByName,
                ),

              actorRole:
                toNullableString(
                  body.createdByRole,
                ),

              comment:
                "Planning draft created.",
            },
          });

          return created;
        },
      );

    return NextResponse.json(
      {
        record,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to create planning record:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to create planning record.",
      },
      {
        status: 500,
      },
    );
  }
}