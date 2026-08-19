"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

type WseTask = {
  id: string;
  sequence: number;
  taskDescription: string;
  hazards: string;
  mitigations: string;
  safetyCritical: boolean;
};

type WseSignature = {
  id: string;
  workerId: string | null;
  workerName: string;
  workerEmail: string | null;
  acknowledgementStatus: string;
  signatureType: string;
  signedAt: string | null;
  signedInAt: string | null;
  signedOutAt: string | null;
  signOutInitials: string | null;
};

type WseMoc = {
  id: string;
  affectedTaskId: string | null;
  changeDescription: string;
  newHazards: string | null;
  newMitigations: string | null;
  requiresPtpRevision: boolean;
  reviewedByName: string | null;
  reviewedAt: string | null;
};

type DailyWse = {
  id: string;
  planningRecordId: string;
  revisionNumber: number;
  engagementDate: string;
  shift: string | null;
  foremanName: string;
  workLocation: string | null;
  emergencyActionPlanReviewed: boolean;
  emergencyNotes: string | null;
  changeStatus: string;
  foremanMorningAcknowledgedAt: string | null;

  endOfShiftIncidentsOrNearMisses: boolean | null;
  endOfShiftConditionsChanged: boolean | null;
  endOfShiftControlsEffective: boolean | null;
  endOfShiftAdditionalHazards: boolean | null;
  endOfShiftWorkedSafely: boolean | null;
  endOfShiftLessonsToShare: boolean | null;
  endOfShiftLessonsLearned: string | null;
  endOfShiftNotes: string | null;

  carryForwardStatus: string | null;
  ptpRevisionRecommended: boolean;
  foremanFinalSignedAt: string | null;

  status: string;

  tasks: WseTask[];
  signatures: WseSignature[];
  mocRecords: WseMoc[];

  planningRecord: {
    id: string;
    title: string;
    planType: string;
    revisionNumber: number;
    effectiveStartDate: string | null;
    effectiveEndDate: string | null;

    company: {
      id: string;
      name: string;
    };

    project: {
      id: string;
      name: string;
      projectCode: string | null;
      clientName: string | null;
      location: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
    };

    contractor: {
      id: string;
      name: string;
      legalName: string | null;
      trade: string | null;
    } | null;
  };
};

type EditableTask = {
  clientId: string;
  taskDescription: string;
  hazards: string;
  mitigations: string;
  safetyCritical: boolean;
};

type EndOfShiftAnswers = {
  incidentsOrNearMisses: boolean | null;
  conditionsChanged: boolean | null;
  controlsEffective: boolean | null;
  additionalHazards: boolean | null;
  workedSafely: boolean | null;
  lessonsToShare: boolean | null;
};

function newTask(): EditableTask {
  return {
    clientId:
      `task-${Date.now()}-${Math.random()}`,
    taskDescription: "",
    hazards: "",
    mitigations: "",
    safetyCritical: false,
  };
}

export default function DailyWsePage() {
  const params =
    useParams<{
      planningRecordId: string;
      wseId: string;
    }>();

  const planningRecordId =
    params.planningRecordId;

  const wseId =
    params.wseId;

  const [wse, setWse] =
    useState<DailyWse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [signingWorker, setSigningWorker] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    changeStatus,
    setChangeStatus,
  ] =
    useState(
      "No Changes",
    );

  const [
    emergencyReviewed,
    setEmergencyReviewed,
  ] =
    useState(false);

  const [
    tasks,
    setTasks,
  ] =
    useState<
      EditableTask[]
    >([]);

  const [
    ptpRevisionRecommended,
    setPtpRevisionRecommended,
  ] =
    useState(false);

  const [
    morningAcknowledged,
    setMorningAcknowledged,
  ] =
    useState(false);

  const [
    workerName,
    setWorkerName,
  ] =
    useState("");

  const [
    workerEmail,
    setWorkerEmail,
  ] =
    useState("");

  const [
    workerAcknowledged,
    setWorkerAcknowledged,
  ] =
    useState(false);

  const [
    endOfShift,
    setEndOfShift,
  ] =
    useState<EndOfShiftAnswers>({
      incidentsOrNearMisses:
        null,
      conditionsChanged:
        null,
      controlsEffective:
        null,
      additionalHazards:
        null,
      workedSafely:
        null,
      lessonsToShare:
        null,
    });

  const [
    lessonsLearned,
    setLessonsLearned,
  ] =
    useState("");

  const [
    endOfShiftNotes,
    setEndOfShiftNotes,
  ] =
    useState("");

  const [
    finalAcknowledged,
    setFinalAcknowledged,
  ] =
    useState(false);

  async function loadWse() {
    setError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}`,
          {
            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as {
          wse?: DailyWse;
          message?: string;
        };

      if (
        !response.ok ||
        !data.wse
      ) {
        throw new Error(
          data.message ||
            "Unable to load Daily WSE.",
        );
      }

      setWse(
        data.wse,
      );

      setChangeStatus(
        data.wse.changeStatus ||
          "No Changes",
      );

      setEmergencyReviewed(
        data.wse
          .emergencyActionPlanReviewed,
      );

      setPtpRevisionRecommended(
        data.wse
          .ptpRevisionRecommended,
      );

      setMorningAcknowledged(
        Boolean(
          data.wse
            .foremanMorningAcknowledgedAt,
        ),
      );

      setTasks(
        data.wse.tasks.map(
          (
            task,
          ) => ({
            clientId:
              task.id,

            taskDescription:
              task.taskDescription,

            hazards:
              task.hazards,

            mitigations:
              task.mitigations,

            safetyCritical:
              task.safetyCritical,
          }),
        ),
      );

      setEndOfShift({
        incidentsOrNearMisses:
          data.wse
            .endOfShiftIncidentsOrNearMisses,

        conditionsChanged:
          data.wse
            .endOfShiftConditionsChanged,

        controlsEffective:
          data.wse
            .endOfShiftControlsEffective,

        additionalHazards:
          data.wse
            .endOfShiftAdditionalHazards,

        workedSafely:
          data.wse
            .endOfShiftWorkedSafely,

        lessonsToShare:
          data.wse
            .endOfShiftLessonsToShare,
      });

      setLessonsLearned(
        data.wse
          .endOfShiftLessonsLearned ||
          "",
      );

      setEndOfShiftNotes(
        data.wse
          .endOfShiftNotes ||
          "",
      );

      setFinalAcknowledged(
        Boolean(
          data.wse
            .foremanFinalSignedAt,
        ),
      );
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof
          Error
          ? loadError.message
          : "Unable to load Daily WSE.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  useEffect(
    () => {
      void loadWse();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      planningRecordId,
      wseId,
    ],
  );

  const projectEmergencyNumber =
    wse?.planningRecord
      .project
      .emergencyContactPhone ||
    "Not configured";

  const projectEmergencyContact =
    wse?.planningRecord
      .project
      .emergencyContactName ||
    "Project emergency contact";

  const hasIncompleteTask =
    useMemo(
      () =>
        tasks.some(
          (
            task,
          ) =>
            !task.taskDescription.trim() ||
            !task.hazards.trim() ||
            !task.mitigations.trim(),
        ),
      [
        tasks,
      ],
    );

  const isCompleted =
    wse?.status ===
    "Completed";

  async function saveMorningReview() {
    if (!wse) {
      return;
    }

    if (
      tasks.length ===
      0
    ) {
      setError(
        "Add at least one task before completing the Daily WSE review.",
      );
      return;
    }

    if (
      hasIncompleteTask
    ) {
      setError(
        "Every task requires a task description, hazards, and controls.",
      );
      return;
    }

    if (
      !emergencyReviewed
    ) {
      setError(
        "Confirm the project emergency contact number was reviewed with the crew.",
      );
      return;
    }

    if (
      !morningAcknowledged
    ) {
      setError(
        "Complete the foreman morning acknowledgement before saving.",
      );
      return;
    }

    setSaving(
      true,
    );
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                changeStatus,

                emergencyActionPlanReviewed:
                  emergencyReviewed,

                foremanMorningAcknowledged:
                  true,

                ptpRevisionRecommended,

                tasks:
                  tasks.map(
                    (
                      task,
                    ) => ({
                      taskDescription:
                        task.taskDescription.trim(),

                      hazards:
                        task.hazards.trim(),

                      mitigations:
                        task.mitigations.trim(),

                      safetyCritical:
                        task.safetyCritical,
                    }),
                  ),

                updatedByName:
                  wse.foremanName,

                updatedByRole:
                  "Foreman / Supervisor",

                updateComment:
                  "Daily WSE morning review saved.",
              }),
          },
        );

      const data =
        (await response.json()) as {
          wse?: DailyWse;
          message?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to save Daily WSE.",
        );
      }

      setSuccess(
        "Daily WSE morning review saved.",
      );

      await loadWse();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save Daily WSE.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function addWorkerAcknowledgement() {
    if (!wse) {
      return;
    }

    if (
      !workerName.trim()
    ) {
      setError(
        "Enter the worker's name.",
      );
      return;
    }

    if (
      !workerAcknowledged
    ) {
      setError(
        "The worker must confirm the acknowledgement before signing.",
      );
      return;
    }

    setSigningWorker(
      true,
    );
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}/signatures`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                workerName:
                  workerName.trim(),

                workerEmail:
                  workerEmail.trim() ||
                  null,

                acknowledged:
                  true,

                userAgent:
                  typeof navigator !==
                  "undefined"
                    ? navigator.userAgent
                    : null,
              }),
          },
        );

      const data =
        (await response.json()) as {
          signature?: WseSignature;
          message?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to capture worker acknowledgement.",
        );
      }

      setWorkerName("");
      setWorkerEmail("");
      setWorkerAcknowledged(
        false,
      );

      setSuccess(
        "Worker acknowledgement captured.",
      );

      await loadWse();
    } catch (
      signError
    ) {
      setError(
        signError instanceof
          Error
          ? signError.message
          : "Unable to capture worker acknowledgement.",
      );
    } finally {
      setSigningWorker(
        false,
      );
    }
  }

  async function signWorkerOut(
    signature:
      WseSignature,
  ) {
    const initials =
      window.prompt(
        `Enter end-of-shift initials for ${signature.workerName}:`,
      );

    if (
      !initials?.trim()
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}/signatures`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                signatureId:
                  signature.id,

                signOutInitials:
                  initials.trim(),
              }),
          },
        );

      const data =
        (await response.json()) as {
          signature?: WseSignature;
          message?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to sign worker out.",
        );
      }

      setSuccess(
        `${signature.workerName} signed out.`,
      );

      await loadWse();
    } catch (
      signOutError
    ) {
      setError(
        signOutError instanceof
          Error
          ? signOutError.message
          : "Unable to sign worker out.",
      );
    }
  }

  async function completeWse() {
    if (!wse) {
      return;
    }

    const allAnswered =
      Object.values(
        endOfShift,
      ).every(
        (
          value,
        ) =>
          value ===
            true ||
          value ===
            false,
      );

    if (
      !allAnswered
    ) {
      setError(
        "Answer every end-of-shift debrief question.",
      );
      return;
    }

    if (
      !finalAcknowledged
    ) {
      setError(
        "Complete the final foreman acknowledgement.",
      );
      return;
    }

    if (
      !window.confirm(
        "Complete and lock this Daily WSE? Completed records cannot be edited.",
      )
    ) {
      return;
    }

    setSaving(
      true,
    );
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completeWse:
                  true,

                endOfShiftIncidentsOrNearMisses:
                  endOfShift.incidentsOrNearMisses,

                endOfShiftConditionsChanged:
                  endOfShift.conditionsChanged,

                endOfShiftControlsEffective:
                  endOfShift.controlsEffective,

                endOfShiftAdditionalHazards:
                  endOfShift.additionalHazards,

                endOfShiftWorkedSafely:
                  endOfShift.workedSafely,

                endOfShiftLessonsToShare:
                  endOfShift.lessonsToShare,

                endOfShiftLessonsLearned:
                  lessonsLearned.trim() ||
                  null,

                endOfShiftNotes:
                  endOfShiftNotes.trim() ||
                  null,

                foremanFinalAcknowledged:
                  true,

                updatedByName:
                  wse.foremanName,

                updatedByRole:
                  "Foreman / Supervisor",

                updateComment:
                  "Daily WSE completed and locked.",
              }),
          },
        );

      const data =
        (await response.json()) as {
          wse?: DailyWse;
          message?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to complete Daily WSE.",
        );
      }

      setSuccess(
        "Daily WSE completed and locked.",
      );

      await loadWse();
    } catch (
      completeError
    ) {
      setError(
        completeError instanceof
          Error
          ? completeError.message
          : "Unable to complete Daily WSE.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <p className="font-bold text-[var(--qoreva-muted)]">
          Loading Daily WSE...
        </p>
      </main>
    );
  }

  if (
    !wse
  ) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-5 text-sm font-bold text-[var(--qoreva-danger)]">
          {error ||
            "Daily WSE was not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/planning/${planningRecordId}`}
            className="text-sm font-black text-[var(--qoreva-violet)]"
          >
            ← Back to PTP
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-[var(--qoreva-violet)]">
            Daily Worker Safety Engagement
          </p>

          <h1 className="mt-1 text-2xl font-black text-[var(--qoreva-obsidian)] sm:text-3xl">
            {formatDate(
              wse.engagementDate,
            )}
          </h1>

          <p className="mt-2 text-sm font-semibold text-[var(--qoreva-muted)]">
            {wse.planningRecord.title} • PTP Rev.{" "}
            {wse.revisionNumber}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-muted)]">
            WSE Status
          </p>

          <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
            {wse.status}
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-danger)]">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-success)]">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <Info
          label="Foreman / Supervisor"
          value={
            wse.foremanName
          }
        />

        <Info
          label="Company / Contractor"
          value={
            wse.planningRecord
              .contractor?.name ||
            wse.planningRecord
              .company.name
          }
        />

        <Info
          label="Project"
          value={
            wse.planningRecord
              .project.name
          }
        />

        <Info
          label="Shift"
          value={
            wse.shift ||
            "Not entered"
          }
        />

        <Info
          label="Task Location"
          value={
            wse.workLocation ||
            "Not entered"
          }
        />

        <Info
          label="PTP"
          value={
            wse.planningRecord
              .title
          }
        />

        <Info
          label="PTP Revision"
          value={String(
            wse.revisionNumber,
          )}
        />

        <Info
          label="Effective Through"
          value={formatDate(
            wse.planningRecord
              .effectiveEndDate,
          )}
        />
      </section>

      <section className="rounded-[1.75rem] border border-[#F0BDC4] bg-white shadow-[var(--qoreva-shadow-sm)]">
        <div className="border-b border-[#F0BDC4] px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-danger)]">
            Emergency Action Information
          </p>

          <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
            Project Emergency Contact
          </h2>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Info
            label="Emergency Contact"
            value={
              projectEmergencyContact
            }
          />

          <div className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
              Emergency Phone Number
            </p>

            <p className="mt-2 text-xl font-black text-[var(--qoreva-obsidian)]">
              {
                projectEmergencyNumber
              }
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 border-t border-[#F0BDC4] px-5 py-4">
          <input
            type="checkbox"
            checked={
              emergencyReviewed
            }
            onChange={(
              event,
            ) =>
              setEmergencyReviewed(
                event.target
                  .checked,
              )
            }
            disabled={
              isCompleted
            }
            className="mt-1 h-5 w-5"
          />

          <span>
            <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
              Reviewed with crew
            </span>

            <span className="mt-1 block text-xs leading-5 text-[var(--qoreva-muted)]">
              Confirm the project emergency phone number was reviewed before work begins.
            </span>
          </span>
        </label>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Management of Change
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Has Anything Changed?
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            [
              "No Changes",
              "Approved PTP remains applicable.",
            ],
            [
              "Minor Changes",
              "Document within the Daily WSE.",
            ],
            [
              "Major Changes",
              "PTP review / revision may be required.",
            ],
          ].map(
            ([
              value,
              description,
            ]) => (
              <button
                key={
                  value
                }
                type="button"
                disabled={
                  isCompleted
                }
                onClick={() => {
                  setChangeStatus(
                    value,
                  );

                  if (
                    value ===
                    "Major Changes"
                  ) {
                    setPtpRevisionRecommended(
                      true,
                    );
                  }
                }}
                className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  changeStatus ===
                  value
                    ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)]"
                    : "border-[var(--qoreva-border)] bg-white"
                }`}
              >
                <p className="font-black text-[var(--qoreva-obsidian)]">
                  {
                    value
                  }
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                  {
                    description
                  }
                </p>
              </button>
            ),
          )}
        </div>

        {changeStatus !==
        "No Changes" ? (
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-4">
            <input
              type="checkbox"
              checked={
                ptpRevisionRecommended
              }
              disabled={
                isCompleted
              }
              onChange={(
                event,
              ) =>
                setPtpRevisionRecommended(
                  event.target
                    .checked,
                )
              }
              className="mt-1 h-5 w-5"
            />

            <span>
              <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                PTP revision required
              </span>

              <span className="mt-1 block text-xs leading-5 text-[var(--qoreva-muted)]">
                Select when the change materially affects the approved scope, hazards, controls, or work method.
              </span>
            </span>
          </label>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
              Today&apos;s Work Plan
            </p>

            <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
              Tasks, Hazards & Controls
            </h2>
          </div>

          <button
            type="button"
            disabled={
              isCompleted
            }
            onClick={() =>
              setTasks(
                (
                  current,
                ) => [
                  ...current,
                  newTask(),
                ],
              )
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Task
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {tasks.map(
            (
              task,
              index,
            ) => (
              <div
                key={
                  task.clientId
                }
                className="rounded-2xl border border-[var(--qoreva-border)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[var(--qoreva-obsidian)]">
                    Work Step{" "}
                    {index + 1}
                  </p>

                  <button
                    type="button"
                    disabled={
                      isCompleted ||
                      tasks.length <=
                        1
                    }
                    onClick={() =>
                      setTasks(
                        (
                          current,
                        ) =>
                          current.filter(
                            (
                              item,
                            ) =>
                              item.clientId !==
                              task.clientId,
                          ),
                      )
                    }
                    className="text-xs font-black text-[var(--qoreva-danger)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Field
                    label="Task / Work Sequence"
                    value={
                      task.taskDescription
                    }
                    disabled={
                      isCompleted
                    }
                    onChange={(
                      value,
                    ) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "taskDescription",
                        value,
                      )
                    }
                    placeholder="What are we doing today?"
                  />

                  <Field
                    label="Hazards — What can hurt us?"
                    value={
                      task.hazards
                    }
                    disabled={
                      isCompleted
                    }
                    onChange={(
                      value,
                    ) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "hazards",
                        value,
                      )
                    }
                    placeholder="Identify today's hazards"
                  />

                  <Field
                    label="Mitigations / Controls"
                    value={
                      task.mitigations
                    }
                    disabled={
                      isCompleted
                    }
                    onChange={(
                      value,
                    ) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "mitigations",
                        value,
                      )
                    }
                    placeholder="How are we preventing the injury?"
                  />
                </div>

                <label className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      task.safetyCritical
                    }
                    disabled={
                      isCompleted
                    }
                    onChange={(
                      event,
                    ) =>
                      setTasks(
                        (
                          current,
                        ) =>
                          current.map(
                            (
                              item,
                            ) =>
                              item.clientId ===
                              task.clientId
                                ? {
                                    ...item,
                                    safetyCritical:
                                      event.target.checked,
                                  }
                                : item,
                          ),
                      )
                    }
                    className="h-5 w-5"
                  />

                  <span className="text-sm font-black text-[var(--qoreva-obsidian)]">
                    Safety Critical
                  </span>
                </label>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Foreman / Supervisor
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Morning Acknowledgement
        </h2>

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--qoreva-border)] p-4">
          <input
            type="checkbox"
            checked={
              morningAcknowledged
            }
            disabled={
              isCompleted
            }
            onChange={(
              event,
            ) =>
              setMorningAcknowledged(
                event.target
                  .checked,
              )
            }
            className="mt-1 h-5 w-5"
          />

          <span>
            <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
              I confirm the information above is accurate and was discussed with the crew.
            </span>

            <span className="mt-1 block text-xs text-[var(--qoreva-muted)]">
              Foreman:{" "}
              {
                wse.foremanName
              }
            </span>
          </span>
        </label>

        {!isCompleted ? (
          <button
            type="button"
            onClick={() =>
              void saveMorningReview()
            }
            disabled={
              saving
            }
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Morning Review"}
          </button>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Worker Acknowledgement
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Crew Signatures
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--qoreva-muted)]">
          MVP captures individual electronic acknowledgement. Future Qoreva Access™ will support hand-drawn signatures with identity verification before signing.
        </p>

        {!isCompleted ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                Worker Name
              </span>

              <input
                value={
                  workerName
                }
                onChange={(
                  event,
                ) =>
                  setWorkerName(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold"
                placeholder="Worker full name"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                Email (optional)
              </span>

              <input
                type="email"
                value={
                  workerEmail
                }
                onChange={(
                  event,
                ) =>
                  setWorkerEmail(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold"
                placeholder="worker@example.com"
              />
            </label>

            <label className="flex items-start gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={
                  workerAcknowledged
                }
                onChange={(
                  event,
                ) =>
                  setWorkerAcknowledged(
                    event.target
                      .checked,
                  )
                }
                className="mt-1 h-5 w-5"
              />

              <span className="text-sm font-bold text-[var(--qoreva-obsidian)]">
                I participated in today&apos;s Worker Safety Engagement, understand the tasks, hazards and controls discussed, and agree to follow the controls and stop work if conditions change.
              </span>
            </label>

            <button
              type="button"
              onClick={() =>
                void addWorkerAcknowledgement()
              }
              disabled={
                signingWorker
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:opacity-60 md:col-span-2"
            >
              {signingWorker
                ? "Signing..."
                : "Acknowledge & Sign In"}
            </button>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {wse.signatures.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
              <p className="text-sm font-bold text-[var(--qoreva-muted)]">
                No worker acknowledgements captured yet.
              </p>
            </div>
          ) : (
            wse.signatures.map(
              (
                signature,
              ) => (
                <div
                  key={
                    signature.id
                  }
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--qoreva-border)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-[var(--qoreva-obsidian)]">
                      {
                        signature.workerName
                      }
                    </p>

                    <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                      Signed in{" "}
                      {formatDateTime(
                        signature.signedInAt,
                      )}
                    </p>

                    {signature.signedOutAt ? (
                      <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                        Signed out{" "}
                        {formatDateTime(
                          signature.signedOutAt,
                        )}{" "}
                        • Initials:{" "}
                        {
                          signature.signOutInitials
                        }
                      </p>
                    ) : null}
                  </div>

                  {!isCompleted &&
                  !signature.signedOutAt ? (
                    <button
                      type="button"
                      onClick={() =>
                        void signWorkerOut(
                          signature,
                        )
                      }
                      className="rounded-xl border border-[var(--qoreva-border-strong)] px-4 py-2 text-xs font-black text-[var(--qoreva-obsidian)]"
                    >
                      Sign Out
                    </button>
                  ) : null}
                </div>
              ),
            )
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          End of Shift Debrief
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Foreman Closeout
        </h2>

        <div className="mt-5 space-y-3">
          <YesNoQuestion
            label="Did any incident, injury, near miss, or property damage occur?"
            value={
              endOfShift.incidentsOrNearMisses
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  incidentsOrNearMisses:
                    value,
                }),
              )
            }
          />

          <YesNoQuestion
            label="Were there any changes in the work or conditions that affected safety?"
            value={
              endOfShift.conditionsChanged
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  conditionsChanged:
                    value,
                }),
              )
            }
          />

          <YesNoQuestion
            label="Were all controls effective?"
            value={
              endOfShift.controlsEffective
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  controlsEffective:
                    value,
                }),
              )
            }
          />

          <YesNoQuestion
            label="Were additional hazards identified?"
            value={
              endOfShift.additionalHazards
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  additionalHazards:
                    value,
                }),
              )
            }
          />

          <YesNoQuestion
            label="Did we work safely as a crew today?"
            value={
              endOfShift.workedSafely
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  workedSafely:
                    value,
                }),
              )
            }
          />

          <YesNoQuestion
            label="Are there any lessons learned to share tomorrow?"
            value={
              endOfShift.lessonsToShare
            }
            disabled={
              isCompleted
            }
            onChange={(
              value,
            ) =>
              setEndOfShift(
                (
                  current,
                ) => ({
                  ...current,
                  lessonsToShare:
                    value,
                }),
              )
            }
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Lessons Learned"
            value={
              lessonsLearned
            }
            disabled={
              isCompleted
            }
            onChange={
              setLessonsLearned
            }
            placeholder="What should be shared with tomorrow's crew?"
          />

          <Field
            label="Actions / Comments"
            value={
              endOfShiftNotes
            }
            disabled={
              isCompleted
            }
            onChange={
              setEndOfShiftNotes
            }
            placeholder="Document follow-up actions or comments."
          />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-[var(--qoreva-violet-faint)] p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Foreman Sign-Off
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Final Daily WSE Confirmation
        </h2>

        {isCompleted ? (
          <div className="mt-5 rounded-2xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] p-4">
            <p className="font-black text-[var(--qoreva-success)]">
              ✓ Daily WSE completed and locked
            </p>

            <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
              Final foreman sign-off:{" "}
              {formatDateTime(
                wse.foremanFinalSignedAt,
              )}
            </p>
          </div>
        ) : (
          <>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4">
              <input
                type="checkbox"
                checked={
                  finalAcknowledged
                }
                onChange={(
                  event,
                ) =>
                  setFinalAcknowledged(
                    event.target
                      .checked,
                  )
                }
                className="mt-1 h-5 w-5"
              />

              <span>
                <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                  I confirm this Daily WSE accurately reflects today&apos;s work, crew acknowledgement, changes, and end-of-shift review.
                </span>

                <span className="mt-1 block text-xs text-[var(--qoreva-muted)]">
                  Foreman:{" "}
                  {
                    wse.foremanName
                  }
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={() =>
                void completeWse()
              }
              disabled={
                saving
              }
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving
                ? "Completing..."
                : "Complete & Lock Daily WSE"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function updateTask(
  setter:
    React.Dispatch<
      React.SetStateAction<
        EditableTask[]
      >
    >,

  clientId:
    string,

  field:
    | "taskDescription"
    | "hazards"
    | "mitigations",

  value:
    string,
) {
  setter(
    (
      current,
    ) =>
      current.map(
        (
          task,
        ) =>
          task.clientId ===
          clientId
            ? {
                ...task,
                [field]:
                  value,
              }
            : task,
      ),
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
        {label}
      </span>

      <textarea
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        placeholder={
          placeholder
        }
        rows={
          4
        }
        className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold text-[var(--qoreva-obsidian)] outline-none transition focus:border-[var(--qoreva-violet)] disabled:bg-[var(--qoreva-surface-muted)]"
      />
    </label>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean | null;
  onChange: (
    value: boolean,
  ) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--qoreva-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[var(--qoreva-obsidian)]">
        {label}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            onChange(
              true,
            )
          }
          className={`rounded-lg border px-4 py-2 text-xs font-black ${
            value ===
            true
              ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)] text-[var(--qoreva-violet)]"
              : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
          } disabled:opacity-50`}
        >
          Yes
        </button>

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            onChange(
              false,
            )
          }
          className={`rounded-lg border px-4 py-2 text-xs font-black ${
            value ===
            false
              ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)] text-[var(--qoreva-violet)]"
              : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
          } disabled:opacity-50`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function formatDate(
  value:
    string | null,
) {
  if (
    !value
  ) {
    return "Not entered";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    },
  ).format(
    date,
  );
}

function formatDateTime(
  value:
    string | null,
) {
  if (
    !value
  ) {
    return "Not completed";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}