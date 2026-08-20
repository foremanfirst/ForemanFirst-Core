import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    wseId: string;
  }>;
};

type TaskInput = {
  id?: string | null;
  taskDescription?: string;
  hazards?: string;
  mitigations?: string;
  safetyCritical?: boolean;
  source?: "PTP" | "Daily";
  sourceWorkStepId?: string | null;
};

type MocInput = {
  affectedTaskId?: string | null;
  changeDescription?: string;
  newHazards?: string | null;
  newMitigations?: string | null;
  requiresPtpRevision?: boolean;
  reviewedByName?: string | null;
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

function toBoolean(value: unknown) {
  return value === true;
}

function toNullableBoolean(value: unknown) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return null;
}

async function loadWse(
  planningRecordId: string,
  wseId: string,
) {
  return prisma.dailyWorkerSafetyEngagement.findFirst({
    where: {
      id: wseId,
      planningRecordId,
    },

    include: {
      planningRecord: {
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
              location: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
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
      },

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
  });
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      wseId,
    } =
      await context.params;

    const wse =
      await loadWse(
        planningRecordId,
        wseId,
      );

    if (!wse) {
      return NextResponse.json(
        {
          message:
            "Daily WSE was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      wse,
    });
  } catch (error) {
    console.error(
      "Unable to load Daily WSE:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load Daily WSE.",
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
    const {
      planningRecordId,
      wseId,
    } =
      await context.params;

    const body =
      await request.json();

    const existing =
      await prisma.dailyWorkerSafetyEngagement.findFirst({
        where: {
          id: wseId,
          planningRecordId,
        },

        select: {
          id: true,
          tenantId: true,
          planningRecordId: true,
          revisionNumber: true,
          status: true,
          foremanName: true,
          emergencyActionPlanReviewed: true,
          foremanMorningAcknowledgedAt: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Daily WSE was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existing.status ===
      "Completed"
    ) {
      return NextResponse.json(
        {
          message:
            "Completed Daily WSE records are locked. Use a controlled correction workflow instead of overwriting the record.",
        },
        {
          status: 409,
        },
      );
    }

    const tasks =
      Array.isArray(
        body.tasks,
      )
        ? (body.tasks as TaskInput[])
        : null;

    if (tasks) {
      if (
        tasks.length ===
        0
      ) {
        return NextResponse.json(
          {
            message:
              "At least one Daily WSE task is required.",
          },
          {
            status: 400,
          },
        );
      }

      const invalidTask =
        tasks.find(
          (task) =>
            !toNullableString(
              task.taskDescription,
            ) ||
            !toNullableString(
              task.hazards,
            ) ||
            !toNullableString(
              task.mitigations,
            ),
        );

      if (invalidTask) {
        return NextResponse.json(
          {
            message:
              "Every Daily WSE task requires a task description, hazards, and controls.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const existingTasks =
      await prisma.dailyWorkerSafetyEngagementTask.findMany({
        where: {
          dailyWseId: wseId,
          tenantId: existing.tenantId,
        },
        orderBy: {
          sequence: "asc",
        },
      });

    if (tasks) {
      const existingPtpTasks =
        existingTasks.filter(
          (task) => task.source === "PTP",
        );

      const submittedPtpIds =
        new Set(
          tasks
            .filter(
              (task) => task.source === "PTP",
            )
            .map(
              (task) =>
                toNullableString(task.id),
            )
            .filter(
              (id): id is string => Boolean(id),
            ),
        );

      const missingPtpTask =
        existingPtpTasks.find(
          (task) =>
            !submittedPtpIds.has(task.id),
        );

      if (missingPtpTask) {
        return NextResponse.json(
          {
            message:
              "Approved PTP work steps cannot be removed from the Daily WSE.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const mocRecords =
      Array.isArray(
        body.mocRecords,
      )
        ? (body.mocRecords as MocInput[])
        : null;

    const changeStatus =
      body.changeStatus !==
      undefined
        ? toNullableString(
            body.changeStatus,
          )
        : undefined;

    if (
      changeStatus &&
      ![
        "No Changes",
        "Minor Changes",
        "Major Changes",
      ].includes(
        changeStatus,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid Daily WSE change status.",
        },
        {
          status: 400,
        },
      );
    }

    const completeWse =
      body.completeWse ===
      true;

    if (completeWse) {
      const currentWse =
        await loadWse(
          planningRecordId,
          wseId,
        );

      if (!currentWse) {
        return NextResponse.json(
          {
            message:
              "Daily WSE was not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (
        !currentWse
          .emergencyActionPlanReviewed
      ) {
        return NextResponse.json(
          {
            message:
              "The project emergency contact number must be reviewed before the Daily WSE can be completed.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        !currentWse
          .foremanMorningAcknowledgedAt
      ) {
        return NextResponse.json(
          {
            message:
              "The foreman morning acknowledgement must be completed before final closeout.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        currentWse
          .tasks.length === 0
      ) {
        return NextResponse.json(
          {
            message:
              "At least one Daily WSE task is required before final closeout.",
          },
          {
            status: 409,
          },
        );
      }

      const signedWorkers =
        currentWse
          .signatures.filter(
            (signature) =>
              signature
                .acknowledgementStatus ===
                "Signed" &&
              Boolean(
                signature.signedAt,
              ),
          );

      if (
        signedWorkers.length ===
        0
      ) {
        return NextResponse.json(
          {
            message:
              "At least one worker acknowledgement is required before completing the Daily WSE.",
          },
          {
            status: 409,
          },
        );
      }

      const endOfShiftFields = [
        body.endOfShiftIncidentsOrNearMisses,
        body.endOfShiftConditionsChanged,
        body.endOfShiftControlsEffective,
        body.endOfShiftAdditionalHazards,
        body.endOfShiftWorkedSafely,
        body.endOfShiftLessonsToShare,
      ];

      if (
        endOfShiftFields.some(
          (value) =>
            value !== true &&
            value !== false,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Answer every end-of-shift debrief question before completing the Daily WSE.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        body.foremanFinalAcknowledged !==
        true
      ) {
        return NextResponse.json(
          {
            message:
              "Final foreman acknowledgement is required before completing the Daily WSE.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const updated =
      await prisma.$transaction(
        async (tx) => {
          await tx.dailyWorkerSafetyEngagement.update({
            where: {
              id: wseId,
            },

            data: {
              foremanName:
                body.foremanName !==
                undefined
                  ? toNullableString(
                      body.foremanName,
                    ) ??
                    undefined
                  : undefined,

              shift:
                body.shift !==
                undefined
                  ? toNullableString(
                      body.shift,
                    )
                  : undefined,

              workLocation:
                body.workLocation !==
                undefined
                  ? toNullableString(
                      body.workLocation,
                    )
                  : undefined,

              /*
               * Risk is intentionally not edited on the Daily WSE.
               * Risk assessment remains controlled by the approved PTP.
               */
              dailyRiskLevel:
                null,

              emergencyActionPlanReviewed:
                body.emergencyActionPlanReviewed !==
                undefined
                  ? toBoolean(
                      body.emergencyActionPlanReviewed,
                    )
                  : undefined,

              emergencyNotes:
                body.emergencyNotes !==
                undefined
                  ? toNullableString(
                      body.emergencyNotes,
                    )
                  : undefined,

              changeStatus:
                changeStatus ??
                undefined,

              foremanMorningAcknowledgedAt:
                body.foremanMorningAcknowledged ===
                true
                  ? new Date()
                  : undefined,

              endOfShiftIncidentsOrNearMisses:
                body.endOfShiftIncidentsOrNearMisses !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftIncidentsOrNearMisses,
                    )
                  : undefined,

              endOfShiftConditionsChanged:
                body.endOfShiftConditionsChanged !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftConditionsChanged,
                    )
                  : undefined,

              endOfShiftControlsEffective:
                body.endOfShiftControlsEffective !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftControlsEffective,
                    )
                  : undefined,

              endOfShiftAdditionalHazards:
                body.endOfShiftAdditionalHazards !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftAdditionalHazards,
                    )
                  : undefined,

              endOfShiftWorkedSafely:
                body.endOfShiftWorkedSafely !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftWorkedSafely,
                    )
                  : undefined,

              endOfShiftLessonsToShare:
                body.endOfShiftLessonsToShare !==
                undefined
                  ? toNullableBoolean(
                      body.endOfShiftLessonsToShare,
                    )
                  : undefined,

              endOfShiftLessonsLearned:
                body.endOfShiftLessonsLearned !==
                undefined
                  ? toNullableString(
                      body.endOfShiftLessonsLearned,
                    )
                  : undefined,

              endOfShiftNotes:
                body.endOfShiftNotes !==
                undefined
                  ? toNullableString(
                      body.endOfShiftNotes,
                    )
                  : undefined,

              carryForwardStatus:
                body.carryForwardStatus !==
                undefined
                  ? toNullableString(
                      body.carryForwardStatus,
                    )
                  : undefined,

              ptpRevisionRecommended:
                body.ptpRevisionRecommended !==
                undefined
                  ? toBoolean(
                      body.ptpRevisionRecommended,
                    )
                  : undefined,

              foremanFinalSignedAt:
                completeWse
                  ? new Date()
                  : undefined,

              status:
                completeWse
                  ? "Completed"
                  : undefined,

              updatedBy:
                body.updatedBy !==
                undefined
                  ? toNullableString(
                      body.updatedBy,
                    )
                  : undefined,
            },
          });

          if (tasks) {
            const existingTaskMap =
              new Map(
                existingTasks.map(
                  (task) => [task.id, task],
                ),
              );

            const ptpTasks =
              tasks.filter(
                (task) => task.source === "PTP",
              );

            const dailyTasks =
              tasks.filter(
                (task) => task.source !== "PTP",
              );

            for (
              const [index, task] of ptpTasks.entries()
            ) {
              const taskId =
                toNullableString(task.id);

              if (!taskId) {
                throw new Error(
                  "Approved PTP work step is missing its Daily WSE task ID.",
                );
              }

              const existingTask =
                existingTaskMap.get(taskId);

              if (
                !existingTask ||
                existingTask.source !== "PTP"
              ) {
                throw new Error(
                  "Approved PTP work step could not be verified.",
                );
              }

              await tx.dailyWorkerSafetyEngagementTask.update({
                where: {
                  id: taskId,
                },
                data: {
                  sequence: index + 1,
                  taskDescription:
                    toNullableString(task.taskDescription)!,
                  hazards:
                    toNullableString(task.hazards)!,
                  mitigations:
                    toNullableString(task.mitigations)!,
                  riskLevel: null,
                  // Safety-critical status is inherited from the approved PTP.
                  safetyCritical:
                    existingTask.safetyCritical,
                  source: "PTP",
                  sourceWorkStepId:
                    existingTask.sourceWorkStepId,
                },
              });
            }

            await tx.dailyWorkerSafetyEngagementTask.deleteMany({
              where: {
                dailyWseId: wseId,
                tenantId: existing.tenantId,
                source: "Daily",
              },
            });

            if (dailyTasks.length > 0) {
              await tx.dailyWorkerSafetyEngagementTask.createMany({
                data:
                  dailyTasks.map(
                    (task, index) => ({
                      tenantId: existing.tenantId,
                      dailyWseId: wseId,
                      sequence:
                        ptpTasks.length + index + 1,
                      taskDescription:
                        toNullableString(task.taskDescription)!,
                      hazards:
                        toNullableString(task.hazards)!,
                      mitigations:
                        toNullableString(task.mitigations)!,
                      riskLevel: null,
                      safetyCritical:
                        task.safetyCritical === true,
                      source: "Daily",
                      sourceWorkStepId: null,
                    }),
                  ),
              });
            }
          }

          if (mocRecords) {
            await tx.dailyWorkerSafetyEngagementMoc.deleteMany({
              where: {
                dailyWseId:
                  wseId,
                tenantId:
                  existing.tenantId,
              },
            });

            if (
              mocRecords.length >
              0
            ) {
              await tx.dailyWorkerSafetyEngagementMoc.createMany({
                data:
                  mocRecords.map(
                    (moc) => ({
                      tenantId:
                        existing.tenantId,

                      dailyWseId:
                        wseId,

                      affectedTaskId:
                        toNullableString(
                          moc.affectedTaskId,
                        ),

                      changeDescription:
                        toNullableString(
                          moc.changeDescription,
                        ) ??
                        "Daily WSE change documented.",

                      newHazards:
                        toNullableString(
                          moc.newHazards,
                        ),

                      newMitigations:
                        toNullableString(
                          moc.newMitigations,
                        ),

                      revisedRiskLevel:
                        null,

                      requiresPtpRevision:
                        moc.requiresPtpRevision ===
                        true,

                      reviewedByName:
                        toNullableString(
                          moc.reviewedByName,
                        ),

                      reviewedAt:
                        moc.reviewedByName
                          ? new Date()
                          : null,
                    }),
                  ),
              });
            }
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existing.tenantId,

              planningRecordId:
                existing.planningRecordId,

              eventType:
                completeWse
                  ? "Daily WSE Completed"
                  : "Daily WSE Updated",

              revisionNumber:
                existing.revisionNumber,

              actorName:
                toNullableString(
                  body.updatedByName,
                ) ??
                existing.foremanName,

              actorRole:
                toNullableString(
                  body.updatedByRole,
                ) ??
                "Foreman / Supervisor",

              comment:
                toNullableString(
                  body.updateComment,
                ) ??
                (completeWse
                  ? "Daily WSE end-of-shift closeout completed."
                  : "Daily WSE field review updated."),

              metadata: {
                dailyWseId:
                  wseId,

                taskCount:
                  tasks?.length ??
                  null,

                changeStatus:
                  changeStatus ??
                  null,

                ptpRevisionRecommended:
                  body.ptpRevisionRecommended ===
                  true,

                completed:
                  completeWse,
              },
            },
          });

          return loadWse(
            planningRecordId,
            wseId,
          );
        },
      );

    return NextResponse.json({
      wse:
        updated,
    });
  } catch (error) {
    console.error(
      "Unable to update Daily WSE:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update Daily WSE.",
      },
      {
        status: 500,
      },
    );
  }
}