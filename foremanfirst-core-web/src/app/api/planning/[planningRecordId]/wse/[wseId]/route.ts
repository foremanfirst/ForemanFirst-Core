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
  id?: string | null;
  affectedTaskId?: string | null;
  changeDescription?: string;
  newHazards?: string | null;
  newMitigations?: string | null;
  requiresPtpRevision?: boolean;
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

async function loadWseWithClient(
  client: {
    dailyWorkerSafetyEngagement: {
      findFirst: typeof prisma.dailyWorkerSafetyEngagement.findFirst;
    };
  },
  planningRecordId: string,
  wseId: string,
) {
  return client.dailyWorkerSafetyEngagement.findFirst({
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

        include: {
          approvals: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                roleLabel: "asc",
              },
            ],
          },
        },
      },
    },
  });
}

async function loadWse(
  planningRecordId: string,
  wseId: string,
) {
  return loadWseWithClient(
    prisma,
    planningRecordId,
    wseId,
  );
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
          changeStatus: true,
          ptpRevisionRecommended: true,
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

    const existingMocRecords =
      await prisma.dailyWorkerSafetyEngagementMoc.findMany({
        where: {
          dailyWseId: wseId,
          tenantId: existing.tenantId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    const existingTaskMap =
      new Map(
        existingTasks.map(
          (task) => [task.id, task],
        ),
      );

    const existingPtpTasks =
      existingTasks.filter(
        (task) =>
          task.source === "PTP",
      );

    if (tasks) {
      const submittedPtpTasks =
        tasks.filter(
          (task) =>
            task.source === "PTP",
        );

      if (
        submittedPtpTasks.length !==
        existingPtpTasks.length
      ) {
        return NextResponse.json(
          {
            message:
              "Approved PTP work steps cannot be added, removed, or replaced inside the Daily WSE.",
          },
          {
            status: 409,
          },
        );
      }

      for (
        const submittedTask of
        submittedPtpTasks
      ) {
        const taskId =
          toNullableString(
            submittedTask.id,
          );

        if (!taskId) {
          return NextResponse.json(
            {
              message:
                "Approved PTP work steps must retain their original Daily WSE task IDs.",
            },
            {
              status: 409,
            },
          );
        }

        const existingTask =
          existingTaskMap.get(
            taskId,
          );

        if (
          !existingTask ||
          existingTask.source !==
            "PTP"
        ) {
          return NextResponse.json(
            {
              message:
                "Approved PTP work step could not be verified against the Daily WSE snapshot.",
            },
            {
              status: 409,
            },
          );
        }

        const submittedSourceWorkStepId =
          toNullableString(
            submittedTask.sourceWorkStepId,
          );

        if (
          submittedSourceWorkStepId &&
          submittedSourceWorkStepId !==
            existingTask.sourceWorkStepId
        ) {
          return NextResponse.json(
            {
              message:
                "Approved PTP work-step linkage cannot be changed inside the Daily WSE.",
            },
            {
              status: 409,
            },
          );
        }

        /*
         * PTP-sourced tasks are immutable snapshots of the approved
         * PlanningWorkStep. Field users document changed conditions
         * through Daily tasks and MOC records instead of rewriting
         * what the approved PTP originally said.
         */
        const taskDescriptionChanged =
          toNullableString(
            submittedTask.taskDescription,
          ) !==
          toNullableString(
            existingTask.taskDescription,
          );

        const hazardsChanged =
          toNullableString(
            submittedTask.hazards,
          ) !==
          toNullableString(
            existingTask.hazards,
          );

        const mitigationsChanged =
          toNullableString(
            submittedTask.mitigations,
          ) !==
          toNullableString(
            existingTask.mitigations,
          );

        if (
          taskDescriptionChanged ||
          hazardsChanged ||
          mitigationsChanged
        ) {
          return NextResponse.json(
            {
              message:
                "Approved PTP task content is locked. Document changed work, hazards, or controls as a Daily task or MOC. Material changes require a controlled PTP revision.",
            },
            {
              status: 409,
            },
          );
        }
      }
    }

    const mocRecords =
      Array.isArray(
        body.mocRecords,
      )
        ? (body.mocRecords as MocInput[])
        : null;

    if (mocRecords) {
      const invalidMoc =
        mocRecords.find(
          (moc) =>
            !toNullableString(
              moc.changeDescription,
            ),
        );

      if (invalidMoc) {
        return NextResponse.json(
          {
            message:
              "Every Daily WSE change / MOC record requires a change description.",
          },
          {
            status: 400,
          },
        );
      }

      const invalidAffectedTask =
        mocRecords.find(
          (moc) => {
            const affectedTaskId =
              toNullableString(
                moc.affectedTaskId,
              );

            return (
              affectedTaskId !==
                null &&
              !existingTaskMap.has(
                affectedTaskId,
              )
            );
          },
        );

      if (invalidAffectedTask) {
        return NextResponse.json(
          {
            message:
              "A Daily WSE change / MOC references a task that does not belong to this WSE.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const requestedChangeStatus =
      body.changeStatus !==
      undefined
        ? toNullableString(
            body.changeStatus,
          )
        : undefined;

    if (
      requestedChangeStatus &&
      ![
        "No Changes",
        "Minor Changes",
        "Major Changes",
      ].includes(
        requestedChangeStatus,
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

    /*
     * Submitted/approved MOC records are official records and must never
     * be silently replaced by an ordinary Daily WSE save. Incoming
     * mocRecords represent the editable Draft portion of the MOC set.
     */
    const protectedMocRecords =
      existingMocRecords.filter(
        (moc) =>
          moc.status !== "Draft",
      );

    const effectiveMocRecords =
      mocRecords !== null
        ? [
            ...protectedMocRecords,
            ...mocRecords,
          ]
        : existingMocRecords;

    const hasPtpRevisionMoc =
      effectiveMocRecords.some(
        (moc) =>
          moc.requiresPtpRevision ===
          true,
      );

    const resolvedChangeStatus =
      hasPtpRevisionMoc
        ? "Major Changes"
        : requestedChangeStatus ??
          existing.changeStatus;

    const submittedDailyTasks =
      tasks
        ? tasks.filter(
            (task) =>
              task.source !== "PTP",
          )
        : [];

    if (
      resolvedChangeStatus ===
        "Minor Changes" &&
      effectiveMocRecords.length ===
        0 &&
      submittedDailyTasks.length ===
        0
    ) {
      return NextResponse.json(
        {
          message:
            "Document the minor change with an Added Today task or a Daily WSE change / MOC record.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      resolvedChangeStatus ===
        "Major Changes" &&
      effectiveMocRecords.length ===
        0
    ) {
      return NextResponse.json(
        {
          message:
            "Major changes require a Daily WSE change / MOC record describing the change before PTP revision escalation.",
        },
        {
          status: 400,
        },
      );
    }

    const resolvedPtpRevisionRecommended =
      existing.ptpRevisionRecommended ||
      body.ptpRevisionRecommended ===
        true ||
      hasPtpRevisionMoc ||
      resolvedChangeStatus ===
        "Major Changes";

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

      const emergencyReviewed =
        body.emergencyActionPlanReviewed !==
        undefined
          ? toBoolean(
              body.emergencyActionPlanReviewed,
            )
          : currentWse
              .emergencyActionPlanReviewed;

      if (!emergencyReviewed) {
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

      const morningAcknowledged =
        body.foremanMorningAcknowledged ===
          true ||
        Boolean(
          currentWse
            .foremanMorningAcknowledgedAt,
        );

      if (!morningAcknowledged) {
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
        resolvedPtpRevisionRecommended
      ) {
        return NextResponse.json(
          {
            message:
              "This Daily WSE documents a material change that requires a controlled PTP revision. Do not complete the WSE as authorized work until the revised PTP has been reviewed and approved.",
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

      const activeSignedWorkers =
        signedWorkers.filter(
          (signature) =>
            !signature.signedOutAt,
        );

      if (
        activeSignedWorkers.length >
        0
      ) {
        return NextResponse.json(
          {
            message:
              "All workers must be signed out before the Daily WSE can be completed and locked.",
          },
          {
            status: 409,
          },
        );
      }

      const blockingMoc =
        currentWse.mocRecords.find(
          (moc) =>
            [
              "PendingApproval",
              "Rejected",
              "RevisionRequired",
            ].includes(
              moc.status,
            ),
        );

      if (blockingMoc) {
        const message =
          blockingMoc.status ===
          "PendingApproval"
            ? "A submitted Management of Change is still pending approval. Resolve the MOC before completing the Daily WSE."
            : blockingMoc.status ===
                "RevisionRequired"
              ? "A Management of Change requires revision. Resolve the required revision before completing the Daily WSE."
              : "A Management of Change was rejected. Resolve the rejected change before completing the Daily WSE.";

        return NextResponse.json(
          {
            message,
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
                requestedChangeStatus !==
                  undefined ||
                mocRecords !== null
                  ? resolvedChangeStatus
                  : undefined,

              foremanMorningAcknowledgedAt:
                body.foremanMorningAcknowledged ===
                  true &&
                !existing.foremanMorningAcknowledgedAt
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
                  undefined ||
                mocRecords !== null ||
                requestedChangeStatus !==
                  undefined
                  ? resolvedPtpRevisionRecommended
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
            const dailyTasks =
              tasks.filter(
                (task) =>
                  task.source !== "PTP",
              );

            /*
             * PTP-sourced task rows are intentionally left untouched.
             * Their content and sequence remain the immutable snapshot
             * created from the approved Planning revision.
             */
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
                      tenantId:
                        existing.tenantId,

                      dailyWseId:
                        wseId,

                      sequence:
                        existingPtpTasks.length +
                        index +
                        1,

                      taskDescription:
                        toNullableString(
                          task.taskDescription,
                        )!,

                      hazards:
                        toNullableString(
                          task.hazards,
                        )!,

                      mitigations:
                        toNullableString(
                          task.mitigations,
                        )!,

                      /*
                       * Daily WSE does not assign an independent
                       * risk rating. Risk remains on the controlling
                       * PTP/work-step planning layer.
                       */
                      riskLevel:
                        null,

                      safetyCritical:
                        task.safetyCritical ===
                        true,

                      source:
                        "Daily",

                      sourceWorkStepId:
                        null,
                    }),
                  ),
              });
            }
          }

          if (mocRecords) {
            const existingDraftMocs =
              existingMocRecords.filter(
                (moc) =>
                  moc.status === "Draft",
              );

            const existingDraftMocMap =
              new Map(
                existingDraftMocs.map(
                  (moc) => [
                    moc.id,
                    moc,
                  ],
                ),
              );

            const submittedDraftIds =
              new Set<string>();

            for (
              const moc of
              mocRecords
            ) {
              const mocId =
                toNullableString(
                  moc.id,
                );

              const data = {
                affectedTaskId:
                  toNullableString(
                    moc.affectedTaskId,
                  ),

                changeDescription:
                  toNullableString(
                    moc.changeDescription,
                  )!,

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
              };

              if (mocId) {
                const existingDraft =
                  existingDraftMocMap.get(
                    mocId,
                  );

                if (!existingDraft) {
                  throw new Error(
                    "Only Draft MOC records belonging to this Daily WSE can be edited through the Daily WSE form.",
                  );
                }

                submittedDraftIds.add(
                  mocId,
                );

                await tx.dailyWorkerSafetyEngagementMoc.update({
                  where: {
                    id: mocId,
                  },

                  data,
                });

                continue;
              }

              await tx.dailyWorkerSafetyEngagementMoc.create({
                data: {
                  tenantId:
                    existing.tenantId,

                  dailyWseId:
                    wseId,

                  ...data,

                  status:
                    "Draft",
                },
              });
            }

            const draftIdsToDelete =
              existingDraftMocs
                .filter(
                  (moc) =>
                    !submittedDraftIds.has(
                      moc.id,
                    ),
                )
                .map(
                  (moc) =>
                    moc.id,
                );

            if (
              draftIdsToDelete.length >
              0
            ) {
              await tx.dailyWorkerSafetyEngagementMoc.deleteMany({
                where: {
                  id: {
                    in:
                      draftIdsToDelete,
                  },

                  dailyWseId:
                    wseId,

                  tenantId:
                    existing.tenantId,

                  status:
                    "Draft",
                },
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

                addedTodayTaskCount:
                  tasks
                    ? tasks.filter(
                        (task) =>
                          task.source !== "PTP",
                      ).length
                    : null,

                changeStatus:
                  requestedChangeStatus !==
                    undefined ||
                  mocRecords !== null
                    ? resolvedChangeStatus
                    : existing.changeStatus,

                mocRecordCount:
                  effectiveMocRecords.length,

                materialChangeDetected:
                  resolvedPtpRevisionRecommended,

                ptpRevisionRecommended:
                  resolvedPtpRevisionRecommended,

                completed:
                  completeWse,
              },
            },
          });

          return loadWseWithClient(
            tx,
            planningRecordId,
            wseId,
          );
        },
      );

    if (!updated) {
      return NextResponse.json(
        {
          message:
            "Daily WSE update completed but the saved record could not be reloaded.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      wse:
        updated,
    });
  } catch (error) {
    console.error(
      "Unable to update Daily WSE:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update Daily WSE.";

    const conflictMessages = [
      "Approved PTP work step is missing its Daily WSE task ID.",
      "Approved PTP work step could not be verified.",
      "Only Draft MOC records belonging to this Daily WSE can be edited through the Daily WSE form.",
    ];

    return NextResponse.json(
      {
        message,
      },
      {
        status:
          conflictMessages.includes(
            message,
          )
            ? 409
            : 500,
      },
    );
  }
}