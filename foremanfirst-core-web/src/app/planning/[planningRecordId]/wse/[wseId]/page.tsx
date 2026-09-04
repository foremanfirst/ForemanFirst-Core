"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
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
  source: "PTP" | "Daily";
  sourceWorkStepId: string | null;
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

type WseMocApproval = {
  id: string;
  roleCode: string;
  roleLabel: string;
  required: boolean;
  sortOrder: number;

  approverId: string | null;
  approverName: string | null;
  approverEmail: string | null;

  status: string;
  decision: string | null;
  comment: string | null;

  decidedById: string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt: string | null;

  notifiedAt: string | null;

  signatureRequired?: boolean;
  signatureType?: string | null;
  signatureData?: unknown;
  signatureAssetKey?: string | null;
  signatureAttestation?: string | null;
  signedAt?: string | null;
};

type WseMoc = {
  id: string;
  affectedTaskId: string | null;
  changeDescription: string;
  newHazards: string | null;
  newMitigations: string | null;
  requiresPtpRevision: boolean;

  status: string;

  submittedByName: string | null;
  submittedByRole: string | null;
  submittedAt: string | null;

  reviewedByName: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;

  reviewDecision: string | null;
  reviewComment: string | null;

  approvedAt: string | null;
  rejectedAt: string | null;

  approvals: WseMocApproval[];
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
  id: string | null;
  taskDescription: string;
  hazards: string;
  mitigations: string;
  safetyCritical: boolean;
  source: "PTP" | "Daily";
  sourceWorkStepId: string | null;
};

type EndOfShiftAnswers = {
  incidentsOrNearMisses: boolean | null;
  conditionsChanged: boolean | null;
  controlsEffective: boolean | null;
  additionalHazards: boolean | null;
  workedSafely: boolean | null;
  lessonsToShare: boolean | null;
};

type EditableMoc = {
  id: string | null;
  affectedTaskId: string | null;
  changeDescription: string;
  newHazards: string;
  newMitigations: string;
  requiresPtpRevision: boolean;
};

type SignaturePoint = {
  x: number;
  y: number;
};

type SignatureStroke = {
  points: SignaturePoint[];
};

type SignaturePayload = {
  format: "qoreva-signature-strokes-v1";
  width: number;
  height: number;
  strokes: SignatureStroke[];
};


function emptyMoc(): EditableMoc {
  return {
    id: null,
    affectedTaskId: null,
    changeDescription: "",
    newHazards: "",
    newMitigations: "",
    requiresPtpRevision: true,
  };
}

function newTask(): EditableTask {
  return {
    clientId:
      `task-${Date.now()}-${Math.random()}`,
    id: null,
    taskDescription: "",
    hazards: "",
    mitigations: "",
    safetyCritical: false,
    source: "Daily",
    sourceWorkStepId: null,
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

  const [
    submittingMoc,
    setSubmittingMoc,
  ] =
    useState(false);

  const [
    reviewingApprovalId,
    setReviewingApprovalId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    approvalComments,
    setApprovalComments,
  ] =
    useState<Record<string, string>>(
      {},
    );

  const [
    approvalModal,
    setApprovalModal,
  ] =
    useState<{
      moc: WseMoc;
      approval: WseMocApproval;
      decision:
        | "Approved"
        | "Rejected"
        | "RevisionRequired";
    } | null>(
      null,
    );

  const [
    approvalSignerName,
    setApprovalSignerName,
  ] =
    useState("");

  const [
    approvalModalComment,
    setApprovalModalComment,
  ] =
    useState("");

  const [
    approvalSignatureStrokes,
    setApprovalSignatureStrokes,
  ] =
    useState<SignatureStroke[]>(
      [],
    );

  const signaturePadRef =
    useRef<SVGSVGElement | null>(
      null,
    );

  const signatureDrawingRef =
    useRef(false);

  const [
    approvalAttested,
    setApprovalAttested,
  ] =
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
    expandedPtpTaskIds,
    setExpandedPtpTaskIds,
  ] =
    useState<Set<string>>(
      new Set(),
    );

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
    draftMoc,
    setDraftMoc,
  ] =
    useState<EditableMoc>(
      emptyMoc(),
    );

  const [
    eligibleWorkers,
    setEligibleWorkers,
  ] =
    useState<
      {
        id: string;
        displayName: string;
        trade: string | null;
        crew: string | null;
        badgeNumber: string | null;
      }[]
    >([]);

  const [
    selectedWorkerId,
    setSelectedWorkerId,
  ] =
    useState("");

  const [
    workerIdentityMessage,
    setWorkerIdentityMessage,
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

      const workerResponse =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}/signatures`,
          {
            cache:
              "no-store",
          },
        );

      const workerData =
        (await workerResponse.json()) as {
          eligibleWorkers?: {
            id: string;
            displayName: string;
            trade: string | null;
            crew: string | null;
            badgeNumber: string | null;
          }[];
          message?: string;
        };

      if (!workerResponse.ok) {
        throw new Error(
          workerData.message ||
            "Unable to load eligible project workers.",
        );
      }

      setEligibleWorkers(
        workerData.eligibleWorkers ??
          [],
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

            id:
              task.id,

            taskDescription:
              task.taskDescription,

            hazards:
              task.hazards,

            mitigations:
              task.mitigations,

            safetyCritical:
              task.safetyCritical,

            source:
              task.source || "Daily",

            sourceWorkStepId:
              task.sourceWorkStepId ?? null,
          }),
        ),
      );

      const existingDraftMoc =
        data.wse.mocRecords.find(
          (moc) =>
            moc.status === "Draft",
        );

      setDraftMoc(
        existingDraftMoc
          ? {
              id:
                existingDraftMoc.id,
              affectedTaskId:
                existingDraftMoc.affectedTaskId,
              changeDescription:
                existingDraftMoc.changeDescription,
              newHazards:
                existingDraftMoc.newHazards || "",
              newMitigations:
                existingDraftMoc.newMitigations || "",
              requiresPtpRevision:
                existingDraftMoc.requiresPtpRevision,
            }
          : emptyMoc(),
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

  const signedWorkers =
    useMemo(
      () =>
        wse?.signatures.filter(
          (signature) =>
            signature.acknowledgementStatus ===
              "Signed" &&
            Boolean(
              signature.signedAt,
            ),
        ) ?? [],
      [
        wse,
      ],
    );

  const allWorkersSignedOut =
    signedWorkers.length >
      0 &&
    signedWorkers.every(
      (signature) =>
        Boolean(
          signature.signedOutAt,
        ),
    );

  const blockingMoc =
    useMemo(
      () =>
        wse?.mocRecords.find(
          (moc) =>
            [
              "PendingApproval",
              "Rejected",
              "RevisionRequired",
            ].includes(
              moc.status,
            ),
        ) ?? null,
      [
        wse,
      ],
    );

  const endOfShiftComplete =
    Object.values(
      endOfShift,
    ).every(
      (value) =>
        value === true ||
        value === false,
    );

  const crewReviewComplete =
    Boolean(
      wse?.foremanMorningAcknowledgedAt,
    );

  const workerAcknowledgementComplete =
    signedWorkers.length >
    0;

  const changeReviewComplete =
    !blockingMoc &&
    !(
      wse?.ptpRevisionRecommended ===
      true
    );

  const wseReadyForFinalization =
    crewReviewComplete &&
    workerAcknowledgementComplete &&
    allWorkersSignedOut &&
    changeReviewComplete &&
    endOfShiftComplete;

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
                      id:
                        task.id,

                      taskDescription:
                        task.taskDescription.trim(),

                      hazards:
                        task.hazards.trim(),

                      mitigations:
                        task.mitigations.trim(),

                      safetyCritical:
                        task.safetyCritical,

                      source:
                        task.source,

                      sourceWorkStepId:
                        task.sourceWorkStepId,
                    }),
                  ),

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

  async function saveDraftMoc() {
    if (!wse) {
      return;
    }

    if (!draftMoc.changeDescription.trim()) {
      setError(
        "Describe what changed before saving the Draft MOC.",
      );
      return;
    }

    if (!draftMoc.newHazards.trim()) {
      setError(
        "Document the new or changed hazards before saving the Draft MOC.",
      );
      return;
    }

    if (!draftMoc.newMitigations.trim()) {
      setError(
        "Document the new or changed controls before saving the Draft MOC.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                changeStatus:
                  "Major Changes",
                ptpRevisionRecommended:
                  draftMoc.requiresPtpRevision,
                mocRecords: [
                  {
                    id:
                      draftMoc.id,
                    affectedTaskId:
                      draftMoc.affectedTaskId,
                    changeDescription:
                      draftMoc.changeDescription.trim(),
                    newHazards:
                      draftMoc.newHazards.trim(),
                    newMitigations:
                      draftMoc.newMitigations.trim(),
                    requiresPtpRevision:
                      draftMoc.requiresPtpRevision,
                  },
                ],
                updateComment:
                  "Daily WSE Draft MOC saved.",
              }),
          },
        );

      const data =
        (await response.json()) as {
          wse?: DailyWse;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save Draft MOC.",
        );
      }

      setSuccess(
        "Draft MOC saved. No approvers have been notified.",
      );

      await loadWse();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Draft MOC.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitMocForApproval() {
    if (!wse) {
      return;
    }

    if (!draftMoc.changeDescription.trim()) {
      setError(
        "Describe what changed before submitting the MOC.",
      );
      return;
    }

    if (!draftMoc.newHazards.trim()) {
      setError(
        "Document the new or changed hazards before submitting the MOC.",
      );
      return;
    }

    if (!draftMoc.newMitigations.trim()) {
      setError(
        "Document the new or changed controls before submitting the MOC.",
      );
      return;
    }

    if (
      !window.confirm(
        "Submit this MOC for approval? After submission, it becomes an official Pending Approval record and can no longer be edited through the Daily WSE form.",
      )
    ) {
      return;
    }

    setSubmittingMoc(
      true,
    );
    setError("");
    setSuccess("");

    try {
      /*
       * Save the latest Draft values first.
       * This ordinary WSE PATCH does NOT trigger notifications.
       */
      const saveResponse =
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
                changeStatus:
                  "Major Changes",

                ptpRevisionRecommended:
                  draftMoc.requiresPtpRevision,

                mocRecords: [
                  {
                    id:
                      draftMoc.id,

                    affectedTaskId:
                      draftMoc.affectedTaskId,

                    changeDescription:
                      draftMoc.changeDescription.trim(),

                    newHazards:
                      draftMoc.newHazards.trim(),

                    newMitigations:
                      draftMoc.newMitigations.trim(),

                    requiresPtpRevision:
                      draftMoc.requiresPtpRevision,
                  },
                ],

                updateComment:
                  "Daily WSE Draft MOC saved before submission.",
              }),
          },
        );

      const saveData =
        (await saveResponse.json()) as {
          wse?: DailyWse;
          message?: string;
        };

      if (
        !saveResponse.ok ||
        !saveData.wse
      ) {
        throw new Error(
          saveData.message ||
            "Unable to save the Draft MOC before submission.",
        );
      }

      const persistedDraft =
        saveData.wse.mocRecords.find(
          (moc) =>
            moc.status ===
              "Draft" &&
            moc.changeDescription ===
              draftMoc.changeDescription.trim(),
        ) ??
        saveData.wse.mocRecords.find(
          (moc) =>
            moc.status ===
            "Draft",
        );

      if (!persistedDraft) {
        throw new Error(
          "The Draft MOC was saved but could not be located for submission.",
        );
      }

      /*
       * This POST is the explicit submission boundary.
       * Only here may Draft transition to PendingApproval.
       */
      const submitResponse =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}/moc/${persistedDraft.id}/submit`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                submittedByName:
                  wse.foremanName,

                submittedByRole:
                  "Foreman / Supervisor",
              }),
          },
        );

      const submitData =
        (await submitResponse.json()) as {
          moc?: WseMoc;
          message?: string;

          notification?: {
            trigger?: boolean;
            dispatched?: boolean;
            message?: string;
          };
        };

      if (!submitResponse.ok) {
        throw new Error(
          submitData.message ||
            "Unable to submit the MOC for approval.",
        );
      }

      setSuccess(
        submitData.notification
          ?.dispatched
          ? "MOC submitted for approval and approvers were notified."
          : "MOC submitted for approval. Approval routing was recorded; notification delivery is not connected yet.",
      );

      await loadWse();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to submit the MOC for approval.",
      );
    } finally {
      setSubmittingMoc(
        false,
      );
    }
  }

  function openMocApprovalModal(
    moc: WseMoc,
    approval: WseMocApproval,
    decision:
      | "Approved"
      | "Rejected"
      | "RevisionRequired",
  ) {
    setApprovalModal({
      moc,
      approval,
      decision,
    });

    setApprovalSignerName(
      approval.approverName ||
        "",
    );

    setApprovalModalComment(
      approvalComments[
        approval.id
      ] || "",
    );

    setApprovalSignatureStrokes([]);
    setApprovalAttested(false);
    setError("");
  }

  function closeMocApprovalModal() {
    if (
      reviewingApprovalId
    ) {
      return;
    }

    setApprovalModal(null);
    setApprovalSignerName("");
    setApprovalModalComment("");
    setApprovalSignatureStrokes([]);
    setApprovalAttested(false);
  }

  function signaturePointFromEvent(
    event:
      React.PointerEvent<SVGSVGElement>,
  ): SignaturePoint | null {
    const element =
      signaturePadRef.current;

    if (!element) {
      return null;
    }

    const rect =
      element.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }

    return {
      x:
        Math.max(
          0,
          Math.min(
            1,
            (event.clientX -
              rect.left) /
              rect.width,
          ),
        ),

      y:
        Math.max(
          0,
          Math.min(
            1,
            (event.clientY -
              rect.top) /
              rect.height,
          ),
        ),
    };
  }

  function beginApprovalSignature(
    event:
      React.PointerEvent<SVGSVGElement>,
  ) {
    if (
      reviewingApprovalId
    ) {
      return;
    }

    const point =
      signaturePointFromEvent(
        event,
      );

    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    signatureDrawingRef.current =
      true;

    setApprovalSignatureStrokes(
      (current) => [
        ...current,
        {
          points:
            [point],
        },
      ],
    );
  }

  function continueApprovalSignature(
    event:
      React.PointerEvent<SVGSVGElement>,
  ) {
    if (
      !signatureDrawingRef.current ||
      reviewingApprovalId
    ) {
      return;
    }

    const point =
      signaturePointFromEvent(
        event,
      );

    if (!point) {
      return;
    }

    setApprovalSignatureStrokes(
      (current) => {
        if (
          current.length ===
          0
        ) {
          return current;
        }

        const next =
          [...current];

        const lastIndex =
          next.length - 1;

        next[lastIndex] = {
          points: [
            ...next[lastIndex]
              .points,
            point,
          ],
        };

        return next;
      },
    );
  }

  function endApprovalSignature(
    event:
      React.PointerEvent<SVGSVGElement>,
  ) {
    signatureDrawingRef.current =
      false;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function clearApprovalSignature() {
    if (
      reviewingApprovalId
    ) {
      return;
    }

    signatureDrawingRef.current =
      false;

    setApprovalSignatureStrokes(
      [],
    );
  }

  function buildSignaturePayload():
    SignaturePayload {
    return {
      format:
        "qoreva-signature-strokes-v1",

      width:
        1000,

      height:
        300,

      strokes:
        approvalSignatureStrokes,
    };
  }

  async function submitMocApprovalDecision() {
    if (
      !wse ||
      !approvalModal
    ) {
      return;
    }

    const {
      moc,
      approval,
      decision,
    } =
      approvalModal;

    const approverName =
      approvalSignerName.trim();

    const comment =
      approvalModalComment.trim();

    if (!approverName) {
      setError(
        "Enter the named approver before recording the decision.",
      );
      return;
    }

    if (
      (
        decision ===
          "Rejected" ||
        decision ===
          "RevisionRequired"
      ) &&
      !comment
    ) {
      setError(
        decision ===
          "Rejected"
          ? "Enter the reason this MOC is being rejected."
          : "Enter what must be revised before this MOC can be approved.",
      );
      return;
    }

    if (
      decision ===
      "Approved"
    ) {
      if (
        approvalSignatureStrokes.length ===
        0
      ) {
        setError(
          "The named approver must draw a signature before approving this MOC.",
        );
        return;
      }

      if (
        !approvalAttested
      ) {
        setError(
          "The named approver must confirm the approval attestation before signing.",
        );
        return;
      }
    }

    setReviewingApprovalId(
      approval.id,
    );
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/wse/${wseId}/moc/${moc.id}/approvals/${approval.id}/decision`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                decision,

                comment:
                  comment ||
                  null,

                decidedByName:
                  approverName,

                decidedByRole:
                  approval.roleLabel,

                signatureType:
                  decision ===
                  "Approved"
                    ? "Drawn"
                    : null,

                signatureData:
                  decision ===
                  "Approved"
                    ? buildSignaturePayload()
                    : null,

                signatureAssetKey:
                  null,

                signatureAttestation:
                  decision ===
                  "Approved"
                    ? "I confirm that I reviewed this Management of Change, understand the change, hazards, and controls, and approve the MOC as the named approver."
                    : null,
              }),
          },
        );

      const data =
        (await response.json()) as {
          message?: string;
          moc?: WseMoc;
          approvals?: WseMocApproval[];
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to record the MOC approval decision.",
        );
      }

      setSuccess(
        data.message ||
          "MOC approval decision recorded.",
      );

      setApprovalComments(
        (current) => ({
          ...current,
          [approval.id]:
            "",
        }),
      );

      setApprovalModal(null);
      setApprovalSignerName("");
      setApprovalModalComment("");
      setApprovalSignatureStrokes([]);
      setApprovalAttested(false);

      await loadWse();
    } catch (
      reviewError
    ) {
      setError(
        reviewError instanceof
          Error
          ? reviewError.message
          : "Unable to record the MOC approval decision.",
      );
    } finally {
      setReviewingApprovalId(
        null,
      );
    }
  }

  async function addWorkerAcknowledgement() {
    if (!wse) {
      return;
    }

    if (
      !selectedWorkerId
    ) {
      setError(
        "Select a project worker.",
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
                workerId:
                  selectedWorkerId,

                acknowledged:
                  true,
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

      setSelectedWorkerId("");
      setWorkerIdentityMessage("");
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
      !crewReviewComplete
    ) {
      setError(
        "Complete the Crew Review before finalizing the Daily WSE.",
      );
      return;
    }

    if (
      !workerAcknowledgementComplete
    ) {
      setError(
        "At least one worker acknowledgement is required before finalizing the Daily WSE.",
      );
      return;
    }

    if (
      !allWorkersSignedOut
    ) {
      setError(
        "Sign out all workers before completing and locking the Daily WSE.",
      );
      return;
    }

    if (blockingMoc) {
      setError(
        blockingMoc.status ===
          "PendingApproval"
          ? "A Management of Change is still pending approval."
          : blockingMoc.status ===
              "RevisionRequired"
            ? "A Management of Change requires revision before this WSE can be completed."
            : "A rejected Management of Change must be resolved before this WSE can be completed.",
      );
      return;
    }

    if (
      wse.ptpRevisionRecommended
    ) {
      setError(
        "A controlled PTP revision is required before this Daily WSE can be completed.",
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
              {
                setEmergencyReviewed(
                  event.target
                    .checked,
                );

                if (
                  event.target.checked &&
                  error ===
                    "Confirm the project emergency contact number was reviewed with the crew."
                ) {
                  setError("");
                }
              }
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
          What&apos;s Different Today?
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
          Compare today&apos;s work and field conditions to the approved PTP.
          If something is different, document it before the affected work begins.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            disabled={isCompleted}
            onClick={() => {
              setChangeStatus("No Changes");
              setPtpRevisionRecommended(false);
            }}
            className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              changeStatus === "No Changes"
                ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                : "border-[var(--qoreva-border)] bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                  changeStatus === "No Changes"
                    ? "bg-white text-[var(--qoreva-success)]"
                    : "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]"
                }`}
              >
                ✓
              </div>

              <div>
                <p className="font-black text-[var(--qoreva-obsidian)]">
                  No Changes
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                  Today&apos;s work, conditions, equipment, and controls match
                  the approved PTP.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isCompleted}
            onClick={() => {
              if (changeStatus === "No Changes") {
                setChangeStatus("Minor Changes");
                setPtpRevisionRecommended(false);
              }
            }}
            className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              changeStatus !== "No Changes"
                ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)]"
                : "border-[var(--qoreva-border)] bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                  changeStatus !== "No Changes"
                    ? "bg-white text-[#9B6212]"
                    : "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]"
                }`}
              >
                !
              </div>

              <div>
                <p className="font-black text-[var(--qoreva-obsidian)]">
                  Something Changed
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                  Scope, location, crew, equipment, materials, conditions,
                  access, or another part of today&apos;s work is different.
                </p>
              </div>
            </div>
          </button>
        </div>

        {changeStatus !== "No Changes" ? (
          <div className="mt-5 rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9B6212]">
              Today&apos;s Change
            </p>

            <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
              How should this change be handled?
            </h3>

            <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--qoreva-muted)]">
              Document field adjustments in today&apos;s WSE. If the change
              may materially affect the approved scope, hazards, controls,
              equipment, conditions, or work method, route it through
              Management of Change before the affected work proceeds.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => {
                  setChangeStatus("Minor Changes");
                  setPtpRevisionRecommended(false);
                }}
                className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  changeStatus === "Minor Changes"
                    ? "border-[var(--qoreva-violet)] bg-white shadow-sm"
                    : "border-[var(--qoreva-border)] bg-white/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-violet-soft)] text-sm font-black text-[var(--qoreva-violet-dark)]">
                    +
                  </div>

                  <div>
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      Document Today&apos;s Adjustment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                      The approved PTP still applies. Capture the added or
                      changed work, hazard, or control in this Daily WSE.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isCompleted}
                onClick={() => {
                  setChangeStatus("Major Changes");
                  setPtpRevisionRecommended(true);

                  setDraftMoc((current) => ({
                    ...current,
                    requiresPtpRevision: true,
                  }));
                }}
                className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  changeStatus === "Major Changes"
                    ? "border-[#D99124] bg-white shadow-sm"
                    : "border-[var(--qoreva-border)] bg-white/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-warning-soft)] text-sm font-black text-[#9B6212]">
                    !
                  </div>

                  <div>
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      Review as Management of Change
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                      Use when the change may materially affect the approved
                      plan and additional review or approval may be required.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {changeStatus === "Minor Changes" ? (
              <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-success-soft)] text-sm font-black text-[var(--qoreva-success)]">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      Daily WSE adjustment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                      Use the Tasks, Hazards &amp; Controls section below to add
                      or document today&apos;s changed work. It remains linked
                      to this Daily WSE and the controlling approved PTP revision.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {changeStatus === "Major Changes" ? (
              <div className="mt-4 rounded-xl border border-[#F0D5A4] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#9B6212]">
                  MOC Review Selected
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Complete the Management of Change information below. Saving
                  remains Draft-only. Approvers are not notified until the MOC
                  is explicitly submitted for approval.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {changeStatus === "Major Changes" ? (
          <div className="mt-5 rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9B6212]">
                  Draft MOC
                </p>

                <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                  Document the Major Change
                </h3>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--qoreva-muted)]">
                  This remains a Draft until it is explicitly submitted for approval. Saving this Draft does not notify the General Contractor or contractor management.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-[#F0D5A4] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#9B6212]">
                Draft — No Notification
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Affected Task (optional)
                </span>

                <select
                  value={draftMoc.affectedTaskId || ""}
                  disabled={isCompleted}
                  onChange={(event) =>
                    setDraftMoc((current) => ({
                      ...current,
                      affectedTaskId:
                        event.target.value || null,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold text-[var(--qoreva-obsidian)]"
                >
                  <option value="">
                    Entire plan / not tied to one task
                  </option>

                  {tasks
                    .filter((task) => task.id)
                    .map((task, index) => (
                      <option
                        key={task.clientId}
                        value={task.id || ""}
                      >
                        Work Step {index + 1} — {task.taskDescription || "Untitled task"}
                      </option>
                    ))}
                </select>
              </label>

              <div className="md:col-span-2">
                <Field
                  label="What changed?"
                  value={draftMoc.changeDescription}
                  disabled={isCompleted}
                  onChange={(value) =>
                    setDraftMoc((current) => ({
                      ...current,
                      changeDescription: value,
                    }))
                  }
                  placeholder="Describe the change from the approved plan, scope, conditions, equipment, crew, or work method."
                />
              </div>

              <Field
                label="New / Changed Hazards"
                value={draftMoc.newHazards}
                disabled={isCompleted}
                onChange={(value) =>
                  setDraftMoc((current) => ({
                    ...current,
                    newHazards: value,
                  }))
                }
                placeholder="What new or changed hazards does this introduce?"
              />

              <Field
                label="New / Changed Controls"
                value={draftMoc.newMitigations}
                disabled={isCompleted}
                onChange={(value) =>
                  setDraftMoc((current) => ({
                    ...current,
                    newMitigations: value,
                  }))
                }
                placeholder="What controls are needed before the affected work can proceed?"
              />
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
              <input
                type="checkbox"
                checked={draftMoc.requiresPtpRevision}
                disabled={isCompleted}
                onChange={(event) => {
                  setDraftMoc((current) => ({
                    ...current,
                    requiresPtpRevision:
                      event.target.checked,
                  }));

                  setPtpRevisionRecommended(
                    event.target.checked,
                  );
                }}
                className="mt-1 h-5 w-5"
              />

              <span>
                <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                  PTP revision required
                </span>

                <span className="mt-1 block text-xs leading-5 text-[var(--qoreva-muted)]">
                  Keep selected when the change materially affects the approved scope, hazards, controls, equipment, conditions, or work method.
                </span>
              </span>
            </label>

            {!isCompleted ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void saveDraftMoc()
                  }
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--qoreva-violet)] bg-white px-5 py-3 text-sm font-black text-[var(--qoreva-violet)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving Draft..."
                    : "Save Draft MOC"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void submitMocForApproval()
                  }
                  disabled={
                    saving ||
                    submittingMoc ||
                    !draftMoc.changeDescription.trim() ||
                    !draftMoc.newHazards.trim() ||
                    !draftMoc.newMitigations.trim()
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingMoc
                    ? "Submitting MOC..."
                    : "Submit MOC for Approval"}
                </button>
              </div>
            ) : null}

            <p className="mt-3 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
              Saving keeps the MOC in Draft and does not notify anyone. Submit MOC for Approval creates the official Pending Approval record and is the only action that triggers the approver-notification workflow.
            </p>
          </div>
        ) : null}

        {wse.mocRecords.filter(
          (moc) => moc.status !== "Draft",
        ).length > 0 ? (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                Submitted MOC Records
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                Submitted MOCs are controlled records. Each required management approval is recorded independently before the parent MOC can become Approved.
              </p>
            </div>

            {wse.mocRecords
              .filter((moc) => moc.status !== "Draft")
              .map((moc) => (
                <div
                  key={moc.id}
                  className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                        Management of Change
                      </p>

                      <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                        {moc.changeDescription}
                      </h3>

                      <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                        Submitted {formatDateTime(moc.submittedAt)}
                        {moc.submittedByName
                          ? ` by ${moc.submittedByName}`
                          : ""}
                        {moc.submittedByRole
                          ? ` • ${moc.submittedByRole}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                        moc.status ===
                        "Approved"
                          ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                          : moc.status ===
                              "Rejected"
                            ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                            : moc.status ===
                                "RevisionRequired"
                              ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                              : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-violet)]"
                      }`}
                    >
                      {moc.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[var(--qoreva-border)] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        New / Changed Hazards
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                        {moc.newHazards ||
                          "Not documented"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--qoreva-border)] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        New / Changed Controls
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                        {moc.newMitigations ||
                          "Not documented"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                        moc.requiresPtpRevision
                          ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                          : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
                      }`}
                    >
                      {moc.requiresPtpRevision
                        ? "PTP Revision Required"
                        : "PTP Revision Not Required"}
                    </span>

                    <span className="rounded-full border border-[var(--qoreva-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                      {moc.approvals.filter(
                        (approval) =>
                          approval.required,
                      ).length}{" "}
                      Required Approval
                      {moc.approvals.filter(
                        (approval) =>
                          approval.required,
                      ).length === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  {moc.approvals.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                        Management Approval Routing
                      </p>

                      {moc.approvals.map(
                        (
                          approval,
                        ) => {
                          const approvalPending =
                            approval.status ===
                            "Pending";

                          const reviewing =
                            reviewingApprovalId ===
                            approval.id;

                          return (
                            <div
                              key={approval.id}
                              className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black text-[var(--qoreva-obsidian)]">
                                      {approval.roleLabel}
                                    </p>

                                    {approval.required ? (
                                      <span className="rounded-full border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#9B6212]">
                                        Required
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                                        Optional
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                                    {approval.approverName
                                      ? `Assigned to ${approval.approverName}`
                                      : "Approver assignment will be resolved through the configured role."}
                                    {approval.approverEmail
                                      ? ` • ${approval.approverEmail}`
                                      : ""}
                                  </p>

                                  {approval.decidedByName ? (
                                    <p className="mt-2 text-xs font-semibold text-[var(--qoreva-muted)]">
                                      Decision recorded by{" "}
                                      {approval.decidedByName}
                                      {approval.decidedByRole
                                        ? ` • ${approval.decidedByRole}`
                                        : ""}
                                      {" • "}
                                      {formatDateTime(
                                        approval.decidedAt,
                                      )}
                                    </p>
                                  ) : null}

                                  {approval.status ===
                                    "Approved" &&
                                  approval.signedAt ? (
                                    <div className="mt-3 rounded-xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] p-3">
                                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-success)]">
                                        Approved & Signed
                                      </p>

                                      <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                                        {approval.decidedByName ||
                                          approval.approverName ||
                                          "Designated Approver"}{" "}
                                        •{" "}
                                        {approval.decidedByRole ||
                                          approval.roleLabel}{" "}
                                        •{" "}
                                        {formatDateTime(
                                          approval.signedAt,
                                        )}
                                      </p>

                                      {isSignaturePayload(
                                        approval.signatureData,
                                      ) ? (
                                        <div className="mt-3">
                                          <SignaturePreview
                                            signatureData={
                                              approval.signatureData
                                            }
                                          />
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {approval.comment ? (
                                    <div className="mt-3 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                                        Review Comment
                                      </p>

                                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                                        {approval.comment}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>

                                <span
                                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                                    approval.status ===
                                    "Approved"
                                      ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                                      : approval.status ===
                                          "Rejected"
                                        ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                                        : approval.status ===
                                            "RevisionRequired"
                                          ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                                          : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-violet)]"
                                  }`}
                                >
                                  {approval.status ===
                                  "Approved" &&
                                  approval.signedAt
                                    ? "Approved & Signed"
                                    : approval.status}
                                </span>
                              </div>

                              {approvalPending &&
                              moc.status ===
                                "PendingApproval" ? (
                                <div className="mt-4 border-t border-[var(--qoreva-border)] pt-4">
                                  <label className="block">
                                    <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                      Review Comment
                                    </span>

                                    <textarea
                                      value={
                                        approvalComments[
                                          approval.id
                                        ] || ""
                                      }
                                      disabled={
                                        reviewing
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        setApprovalComments(
                                          (
                                            current,
                                          ) => ({
                                            ...current,
                                            [approval.id]:
                                              event.target.value,
                                          }),
                                        )
                                      }
                                      rows={3}
                                      placeholder="Optional for approval. Required when rejecting or requesting revision."
                                      className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold text-[var(--qoreva-obsidian)] outline-none transition focus:border-[var(--qoreva-violet)] disabled:bg-[var(--qoreva-surface-muted)]"
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <button
                                      type="button"
                                      disabled={
                                        reviewing
                                      }
                                      onClick={() =>
                                        openMocApprovalModal(
                                          moc,
                                          approval,
                                          "Approved",
                                        )
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-4 py-2 text-xs font-black text-[var(--qoreva-success)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {reviewing
                                        ? "Recording..."
                                        : "Approve & Sign"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        reviewing
                                      }
                                      onClick={() =>
                                        openMocApprovalModal(
                                          moc,
                                          approval,
                                          "RevisionRequired",
                                        )
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-4 py-2 text-xs font-black text-[#9B6212] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Request Revision
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        reviewing
                                      }
                                      onClick={() =>
                                        openMocApprovalModal(
                                          moc,
                                          approval,
                                          "Rejected",
                                        )
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-2 text-xs font-black text-[var(--qoreva-danger)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>

                                  <p className="mt-3 text-[11px] font-semibold leading-5 text-[var(--qoreva-muted)]">
                                    Development workflow: the reviewer identity is captured when the decision is submitted. Production authorization must also verify the signed-in user against this configured approval role at the backend.
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-white p-4">
                      <p className="text-xs font-bold text-[var(--qoreva-muted)]">
                        No individual approval records are attached to this MOC. MOCs submitted before the multi-approver workflow was enabled may require migration or resubmission for testing.
                      </p>
                    </div>
                  )}

                  {moc.reviewComment ? (
                    <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        Final Disposition Comment
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                        {moc.reviewComment}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        ) : null}
      </section>

      {tasks.filter(
        (task) =>
          task.source === "PTP" &&
          task.safetyCritical,
      ).length > 0 ? (
        <section className="rounded-[1.75rem] border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-danger)]">
                Today&apos;s Safety-Critical Work
              </p>

              <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                Review Before Work Begins
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
                These work steps are marked Safety Critical in the approved PTP.
                The foreman should review the associated hazards and controls with
                the crew before the affected work begins.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-[#F0BDC4] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-danger)]">
              {
                tasks.filter(
                  (task) =>
                    task.source === "PTP" &&
                    task.safetyCritical,
                ).length
              }{" "}
              Safety Critical
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {tasks
              .filter(
                (task) =>
                  task.source === "PTP" &&
                  task.safetyCritical,
              )
              .map((task, index) => (
                <div
                  key={task.clientId}
                  className="rounded-2xl border border-[#F0BDC4] bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-danger)]">
                          Safety Critical
                        </span>

                        <span className="rounded-full border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-violet-dark)]">
                          Approved PTP
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        Work Step {index + 1}
                      </p>

                      <p className="mt-1 text-base font-black leading-6 text-[var(--qoreva-obsidian)]">
                        {task.taskDescription ||
                          "Approved safety-critical work step"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        Hazards
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                        {task.hazards ||
                          "No hazards documented on the approved PTP."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        Controls
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                        {task.mitigations ||
                          "No controls documented on the approved PTP."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

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
            onClick={() => {
              setTasks(
                (current) => [
                  ...current,
                  newTask(),
                ],
              );

              if (changeStatus === "No Changes") {
                setChangeStatus("Minor Changes");
              }
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Task
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {tasks.map((task, index) => {
            const inheritedFromPtp =
              task.source === "PTP";

            const ptpTaskKey =
              task.id ||
              task.sourceWorkStepId ||
              task.clientId;

            const ptpTaskExpanded =
              expandedPtpTaskIds.has(
                ptpTaskKey,
              );

            if (inheritedFromPtp) {
              return (
                <div
                  key={task.clientId}
                  className="overflow-hidden rounded-2xl border border-[var(--qoreva-border)] bg-white"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-violet-dark)]">
                            Approved PTP
                          </span>

                          {task.safetyCritical ? (
                            <span className="rounded-full border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-danger)]">
                              Safety Critical
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                          Work Step {index + 1}
                        </p>

                        <h3 className="mt-1 text-base font-black leading-6 text-[var(--qoreva-obsidian)] sm:text-lg">
                          {task.taskDescription ||
                            "Approved work step"}
                        </h3>

                        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                          Inherited from the approved PTP and locked for today&apos;s WSE.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setExpandedPtpTaskIds(
                            (current) => {
                              const next =
                                new Set(
                                  current,
                                );

                              if (
                                next.has(
                                  ptpTaskKey,
                                )
                              ) {
                                next.delete(
                                  ptpTaskKey,
                                );
                              } else {
                                next.add(
                                  ptpTaskKey,
                                );
                              }

                              return next;
                            },
                          );
                        }}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-2 text-xs font-black text-[var(--qoreva-violet)] transition hover:border-[var(--qoreva-violet)]"
                        aria-expanded={
                          ptpTaskExpanded
                        }
                      >
                        {ptpTaskExpanded
                          ? "Hide Hazards & Controls"
                          : "View Hazards & Controls"}
                      </button>
                    </div>
                  </div>

                  {ptpTaskExpanded ? (
                    <div className="border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:p-5">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                            Approved Hazards
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                            {task.hazards ||
                              "No hazards documented on the approved PTP."}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                            Approved Controls
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                            {task.mitigations ||
                              "No controls documented on the approved PTP."}
                          </p>
                        </div>
                      </div>

                      {task.safetyCritical ? (
                        <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
                            Safety-Critical Work Step
                          </p>

                          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                            Safety-critical status is controlled by the approved PTP and cannot be changed from the Daily WSE.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <div
                key={task.clientId}
                className="rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)]/30 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#9B6212]">
                        Added Today
                      </span>

                      {task.safetyCritical ? (
                        <span className="rounded-full border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-danger)]">
                          Safety Critical
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm font-black text-[var(--qoreva-obsidian)]">
                      Additional Work Step
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                      Document work being performed today that was not inherited directly from the approved PTP.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() =>
                      setTasks(
                        (current) =>
                          current.filter(
                            (item) =>
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
                    disabled={isCompleted}
                    onChange={(value) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "taskDescription",
                        value,
                      )
                    }
                    placeholder="What additional work are we doing today?"
                  />

                  <Field
                    label="Hazards — What can hurt us?"
                    value={task.hazards}
                    disabled={isCompleted}
                    onChange={(value) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "hazards",
                        value,
                      )
                    }
                    placeholder="Identify hazards for this added work"
                  />

                  <Field
                    label="Mitigations / Controls"
                    value={
                      task.mitigations
                    }
                    disabled={isCompleted}
                    onChange={(value) =>
                      updateTask(
                        setTasks,
                        task.clientId,
                        "mitigations",
                        value,
                      )
                    }
                    placeholder="How will these hazards be controlled?"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--qoreva-border)] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        task.safetyCritical
                      }
                      disabled={isCompleted}
                      onChange={(event) =>
                        setTasks(
                          (current) =>
                            current.map(
                              (item) =>
                                item.clientId ===
                                task.clientId
                                  ? {
                                      ...item,
                                      safetyCritical:
                                        event
                                          .target
                                          .checked,
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

                  <p className="max-w-2xl text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                    Added work stays linked to today&apos;s WSE. If it materially changes the approved scope, hazards, controls, equipment, conditions, or work method, use Management of Change and review whether the PTP requires revision.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Foreman / Supervisor
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Crew Review
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
          Review today&apos;s approved work, critical controls, field changes,
          emergency information, and stop-work expectations with the crew before
          work begins.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[var(--qoreva-violet)]">
                1
              </div>

              <div>
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  Approved PTP &amp; Today&apos;s Work
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Review the controlling PTP revision and the work planned for
                  today.
                </p>

                <p className="mt-2 text-xs font-black text-[var(--qoreva-success)]">
                  {tasks.filter(
                    (task) => task.source === "PTP",
                  ).length}{" "}
                  approved work step
                  {tasks.filter(
                    (task) => task.source === "PTP",
                  ).length === 1
                    ? ""
                    : "s"}{" "}
                  loaded
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[var(--qoreva-danger)]">
                2
              </div>

              <div>
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  Safety-Critical Work
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Review safety-critical hazards and controls before the affected
                  work begins.
                </p>

                <p
                  className={`mt-2 text-xs font-black ${
                    tasks.some(
                      (task) =>
                        task.source === "PTP" &&
                        task.safetyCritical,
                    )
                      ? "text-[var(--qoreva-danger)]"
                      : "text-[var(--qoreva-success)]"
                  }`}
                >
                  {
                    tasks.filter(
                      (task) =>
                        task.source === "PTP" &&
                        task.safetyCritical,
                    ).length
                  }{" "}
                  safety-critical work step
                  {tasks.filter(
                    (task) =>
                      task.source === "PTP" &&
                      task.safetyCritical,
                  ).length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#9B6212]">
                3
              </div>

              <div>
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  What&apos;s Different Today?
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Discuss changes from the approved plan and any additional work
                  being performed today.
                </p>

                <p
                  className={`mt-2 text-xs font-black ${
                    changeStatus === "No Changes"
                      ? "text-[var(--qoreva-success)]"
                      : "text-[#9B6212]"
                  }`}
                >
                  {changeStatus === "No Changes"
                    ? "No changes identified"
                    : changeStatus === "Minor Changes"
                      ? "Daily adjustment documented"
                      : "Management of Change review selected"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[var(--qoreva-violet)]">
                4
              </div>

              <div>
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  Emergency &amp; Stop-Work Expectations
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Confirm the crew knows the project emergency information and
                  understands their responsibility to stop work when conditions
                  are unsafe or no longer match the plan.
                </p>

                <p
                  className={`mt-2 text-xs font-black ${
                    emergencyReviewed
                      ? "text-[var(--qoreva-success)]"
                      : "text-[#9B6212]"
                  }`}
                >
                  {emergencyReviewed
                    ? "Emergency information reviewed"
                    : "Emergency information review required"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <label
          className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 transition ${
            Boolean(
              wse.foremanMorningAcknowledgedAt,
            )
              ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
              : "border-[var(--qoreva-border)] bg-white"
          }`}
        >
          <input
            type="checkbox"
            checked={
              Boolean(
                wse.foremanMorningAcknowledgedAt,
              ) ||
              morningAcknowledged
            }
            disabled={
              isCompleted ||
              Boolean(
                wse.foremanMorningAcknowledgedAt,
              )
            }
            onChange={(event) => {
              if (
                wse.foremanMorningAcknowledgedAt
              ) {
                return;
              }

              setMorningAcknowledged(
                event.target.checked,
              );

              if (
                event.target.checked &&
                error ===
                  "Complete the foreman morning acknowledgement before saving."
              ) {
                setError("");
              }
            }}
            className="mt-1 h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70"
          />

          <span>
            <span className="block text-sm font-black leading-6 text-[var(--qoreva-obsidian)]">
              I confirm I reviewed today&apos;s work with the crew, including
              the approved PTP, safety-critical work and controls, changes from
              the approved plan, emergency information, and stop-work
              expectations.
            </span>

            <span className="mt-2 block text-xs font-semibold text-[var(--qoreva-muted)]">
              Foreman / Supervisor:{" "}
              {wse.foremanName}
            </span>

            {wse.foremanMorningAcknowledgedAt ? (
              <>
                <span className="mt-2 block text-xs font-black text-[var(--qoreva-success)]">
                  ✓ Crew review completed and recorded
                </span>

                <span className="mt-1 block text-xs font-medium text-[var(--qoreva-muted)]">
                  Recorded:{" "}
                  {formatDateTime(
                    wse.foremanMorningAcknowledgedAt,
                  )}
                </span>
              </>
            ) : null}
          </span>
        </label>

        {!isCompleted ? (
          wse.foremanMorningAcknowledgedAt ? (
            <div className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-5 py-3 text-sm font-black text-[var(--qoreva-success)]">
              ✓ Crew Review Completed
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                void saveMorningReview()
              }
              disabled={
                saving ||
                !morningAcknowledged
              }
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Crew Review..."
                : "Complete Crew Review"}
            </button>
          )
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Crew Acknowledgement
        </p>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--qoreva-obsidian)]">
              Worker Sign-In
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
              Each worker must personally acknowledge today&apos;s Worker Safety
              Engagement after the crew review and before performing the covered
              work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
              {wse.signatures.length}{" "}
              Worker
              {wse.signatures.length === 1
                ? ""
                : "s"}{" "}
              Signed In
            </span>

            {wse.signatures.length > 0 ? (
              <span className="inline-flex rounded-full border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-success)]">
                Crew Acknowledgements Active
              </span>
            ) : null}
          </div>
        </div>

        {!isCompleted ? (
          <div className="mt-5 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-[var(--qoreva-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                  Manual Crew Sign-In
                </p>

                <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                  Foreman-assisted acknowledgement
                </p>

                <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Use this field flow when workers are acknowledging directly
                  with the foreman or supervisor.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-[var(--qoreva-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                MVP
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Worker
                </span>

                <select
                  value={
                    selectedWorkerId
                  }
                  onChange={(event) => {
                    setSelectedWorkerId(
                      event.target.value,
                    );

                    setWorkerIdentityMessage(
                      "",
                    );

                    setWorkerAcknowledged(
                      false,
                    );
                  }}
                  className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold"
                >
                  <option value="">
                    Select an active project worker
                  </option>

                  {eligibleWorkers.map(
                    (worker) => (
                      <option
                        key={
                          worker.id
                        }
                        value={
                          worker.id
                        }
                      >
                        {worker.displayName}
                        {worker.trade
                          ? ` — ${worker.trade}`
                          : ""}
                        {worker.crew
                          ? ` • ${worker.crew}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                {eligibleWorkers.length ===
                0 ? (
                  <p className="mt-2 text-xs font-semibold text-[var(--qoreva-muted)]">
                    No active workers are currently assigned to this project.
                  </p>
                ) : null}
              </label>

              <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 md:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Identity Verification
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                      Verify identity when the project requires it.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                      Identity verification is not currently required for this
                      project. The verification step remains visible so the
                      workflow can support future project requirements without
                      changing the acknowledgement process.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !selectedWorkerId
                      ) {
                        setWorkerIdentityMessage(
                          "Select the worker before starting identity verification.",
                        );

                        return;
                      }

                      setWorkerIdentityMessage(
                        "Identity verification is not required for this project. Continue with the worker acknowledgement.",
                      );
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-soft)] px-5 py-3 text-sm font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)]"
                  >
                    Verify Identity
                  </button>
                </div>

                {workerIdentityMessage ? (
                  <div className="mt-3 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                    {workerIdentityMessage}
                  </div>
                ) : null}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 md:col-span-2">
                <input
                  type="checkbox"
                  checked={
                    workerAcknowledged
                  }
                  onChange={(event) =>
                    setWorkerAcknowledged(
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5"
                />

                <span>
                  <span className="block text-sm font-black leading-6 text-[var(--qoreva-obsidian)]">
                    I personally participated in today&apos;s Worker Safety
                    Engagement.
                  </span>

                  <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                    I understand the work, hazards, controls, emergency
                    expectations, and changes discussed. I will follow the
                    controls and stop work if conditions become unsafe or no
                    longer match the plan.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  void addWorkerAcknowledgement()
                }
                disabled={
                  signingWorker ||
                  !selectedWorkerId ||
                  !workerAcknowledged
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
              >
                {signingWorker
                  ? "Recording Worker Acknowledgement..."
                  : "Acknowledge & Sign In"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                Today&apos;s Crew
              </p>

              <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                Recorded Worker Acknowledgements
              </p>
            </div>

            <p className="text-xs font-semibold text-[var(--qoreva-muted)]">
              {wse.signatures.length} acknowledgement
              {wse.signatures.length === 1
                ? ""
                : "s"}{" "}
              recorded
            </p>
          </div>

          <div className="mt-3 space-y-3">
            {wse.signatures.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  No workers have acknowledged this WSE yet.
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Worker acknowledgements will appear here as each crew member
                  signs in.
                </p>
              </div>
            ) : (
              wse.signatures.map(
                (signature, index) => (
                  <div
                    key={signature.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-success-soft)] text-sm font-black text-[var(--qoreva-success)]">
                        ✓
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[var(--qoreva-obsidian)]">
                            {signature.workerName}
                          </p>

                          <span className="rounded-full border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-success)]">
                            Acknowledged
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                          Crew Member {index + 1}
                          {" • "}
                          Signed in{" "}
                          {formatDateTime(
                            signature.signedInAt,
                          )}
                        </p>

                        {signature.signedOutAt ? (
                          <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                            Signed out{" "}
                            {formatDateTime(
                              signature.signedOutAt,
                            )}
                            {" • "}
                            Initials:{" "}
                            {signature.signOutInitials}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-black text-[var(--qoreva-success)]">
                            Active on today&apos;s WSE
                          </p>
                        )}
                      </div>
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
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] px-4 py-2 text-xs font-black text-[var(--qoreva-obsidian)]"
                      >
                        Sign Out
                      </button>
                    ) : null}
                  </div>
                ),
              )
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
            Future Crew QR Workflow
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
            Future versions can allow workers to scan the Daily WSE QR code on
            their own device, authenticate their Qoreva identity, review the
            controlling work information, and personally acknowledge the WSE.
            Manual foreman-assisted sign-in will remain available as a field
            fallback.
          </p>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          End-of-Shift Learning
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          How Did Today Go?
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
          Capture what happened in the field, what changed, and anything the
          next crew should know. Keep this review short and focused on useful
          field learning.
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <YesNoQuestion
              label="Did any safety event occur today?"
              value={
                endOfShift.incidentsOrNearMisses
              }
              disabled={isCompleted}
              onChange={(value) =>
                setEndOfShift(
                  (current) => ({
                    ...current,
                    incidentsOrNearMisses:
                      value,
                  }),
                )
              }
            />

            {endOfShift.incidentsOrNearMisses === true ? (
              <div className="mt-3 rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-3">
                <p className="text-xs font-black text-[#9B6212]">
                  Follow-up required
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Document the incident, injury, near miss, property damage,
                  Good Catch, or other event in the appropriate Qoreva record.
                  Use the follow-up notes below to capture anything that still
                  needs action.
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <YesNoQuestion
              label="Did conditions or work change?"
              value={
                endOfShift.conditionsChanged
              }
              disabled={isCompleted}
              onChange={(value) =>
                setEndOfShift(
                  (current) => ({
                    ...current,
                    conditionsChanged:
                      value,

                    additionalHazards:
                      value,
                  }),
                )
              }
            />

            <p className="mt-2 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
              Consider scope, location, crew, equipment, work method, site
              conditions, access, adjacent work, and newly identified hazards.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <YesNoQuestion
              label="Did any control fail or need improvement?"
              value={
                endOfShift.controlsEffective === null
                  ? null
                  : !endOfShift.controlsEffective
              }
              disabled={isCompleted}
              onChange={(value) =>
                setEndOfShift(
                  (current) => ({
                    ...current,
                    controlsEffective:
                      value === null
                        ? null
                        : !value,
                  }),
                )
              }
            />

            {endOfShift.controlsEffective === false ? (
              <div className="mt-3 rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-3">
                <p className="text-xs font-black text-[#9B6212]">
                  Capture the improvement
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                  Use the follow-up field below to document the control that
                  failed, became ineffective, or should be improved before the
                  work is performed again.
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <YesNoQuestion
              label="Was today's work completed safely and in accordance with the approved plan?"
              value={
                endOfShift.workedSafely
              }
              disabled={isCompleted}
              onChange={(value) =>
                setEndOfShift(
                  (current) => ({
                    ...current,
                    workedSafely:
                      value,
                  }),
                )
              }
            />

            <p className="mt-2 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
              This remains a direct foreman determination and is not inferred
              by Qoreva.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 sm:p-5">
          <YesNoQuestion
            label="Is there anything tomorrow's crew should know?"
            value={
              endOfShift.lessonsToShare
            }
            disabled={isCompleted}
            onChange={(value) =>
              setEndOfShift(
                (current) => ({
                  ...current,
                  lessonsToShare:
                    value,
                }),
              )
            }
          />

          {endOfShift.lessonsToShare === true ? (
            <div className="mt-4">
              <Field
                label="Carry Forward to Tomorrow"
                value={lessonsLearned}
                disabled={isCompleted}
                onChange={
                  setLessonsLearned
                }
                placeholder="What should the next crew know before work begins?"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <Field
            label="Follow-Up Actions / Comments"
            value={
              endOfShiftNotes
            }
            disabled={isCompleted}
            onChange={
              setEndOfShiftNotes
            }
            placeholder="Document corrective actions, follow-up items, responsible parties, or other important information."
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
            Field Learning
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
            Qoreva preserves this closeout with the Daily WSE so recurring
            changes, ineffective controls, incidents, and lessons learned can
            support future Planning and Qoreva Intelligence.
          </p>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-[var(--qoreva-violet-faint)] p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          Foreman Sign-Off
        </p>

        <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
          Final Daily WSE Confirmation
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
          Finalize the Daily WSE only after the crew acknowledgement,
          end-of-shift review, and any required follow-up or change
          documentation are complete.
        </p>

        {!isCompleted ? (
          <div className="mt-5 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                  WSE Readiness
                </p>

                <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                  Ready to complete and lock?
                </p>
              </div>

              <span
                className={
                  wseReadyForFinalization
                    ? "inline-flex w-fit rounded-full border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-success)]"
                    : "inline-flex w-fit rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]"
                }
              >
                {wseReadyForFinalization
                  ? "Ready for Final Sign-Off"
                  : "Action Required"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                {
                  label:
                    "Crew Review",
                  detail:
                    crewReviewComplete
                      ? "Completed"
                      : "Complete the Crew Review",
                  ready:
                    crewReviewComplete,
                },
                {
                  label:
                    "Worker Acknowledgement",
                  detail:
                    workerAcknowledgementComplete
                      ? `${signedWorkers.length} worker acknowledgement${signedWorkers.length === 1 ? "" : "s"} recorded`
                      : "At least one worker acknowledgement required",
                  ready:
                    workerAcknowledgementComplete,
                },
                {
                  label:
                    "Crew Sign-Out",
                  detail:
                    allWorkersSignedOut
                      ? "All acknowledged workers signed out"
                      : workerAcknowledgementComplete
                        ? "One or more workers are still active"
                        : "Waiting for worker acknowledgement",
                  ready:
                    allWorkersSignedOut,
                },
                {
                  label:
                    "Change / MOC Review",
                  detail:
                    blockingMoc
                      ? blockingMoc.status ===
                          "PendingApproval"
                        ? "MOC approval pending"
                        : blockingMoc.status ===
                            "RevisionRequired"
                          ? "MOC revision required"
                          : "Rejected MOC requires resolution"
                      : wse.ptpRevisionRecommended
                        ? "Controlled PTP revision required"
                        : "No blocking change workflow",
                  ready:
                    changeReviewComplete,
                },
                {
                  label:
                    "End-of-Shift Learning",
                  detail:
                    endOfShiftComplete
                      ? "Closeout questions complete"
                      : "Complete the end-of-shift review",
                  ready:
                    endOfShiftComplete,
                },
              ].map(
                (item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3"
                  >
                    <div
                      className={
                        item.ready
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-success-soft)] text-xs font-black text-[var(--qoreva-success)]"
                          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--qoreva-border-strong)] bg-white text-xs font-black text-[var(--qoreva-muted)]"
                      }
                    >
                      {item.ready
                        ? "✓"
                        : "!"}
                    </div>

                    <div>
                      <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-[var(--qoreva-muted)]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}

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
                disabled={
                  !wseReadyForFinalization
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
                  I confirm this Daily WSE accurately reflects today&apos;s work, worker acknowledgements, identified changes, end-of-shift conditions, and required follow-up actions.
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
                saving ||
                !wseReadyForFinalization ||
                !finalAcknowledged
              }
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Completing & Locking..."
                : "Complete & Lock Daily WSE"}
            </button>
          </>
        )}
      </section>

      {approvalModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moc-review-title"
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] border border-[var(--qoreva-border)] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--qoreva-border)] p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                  Management of Change
                </p>

                <h2
                  id="moc-review-title"
                  className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]"
                >
                  {approvalModal.decision ===
                  "Approved"
                    ? "Approve & Sign MOC"
                    : approvalModal.decision ===
                        "RevisionRequired"
                      ? "Request MOC Revision"
                      : "Reject MOC"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--qoreva-muted)]">
                  {approvalModal.approval.roleLabel} •{" "}
                  {approvalModal.moc.changeDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeMocApprovalModal
                }
                disabled={Boolean(
                  reviewingApprovalId,
                )}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--qoreva-border)] text-lg font-black text-[var(--qoreva-muted)] disabled:opacity-50"
                aria-label="Close MOC review"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                    New / Changed Hazards
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                    {approvalModal.moc
                      .newHazards ||
                      "Not documented"}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                    New / Changed Controls
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                    {approvalModal.moc
                      .newMitigations ||
                      "Not documented"}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Named Approver
                </span>

                <input
                  value={
                    approvalSignerName
                  }
                  onChange={(event) =>
                    setApprovalSignerName(
                      event.target.value,
                    )
                  }
                  disabled={Boolean(
                    reviewingApprovalId,
                  )}
                  placeholder="Approver full name"
                  className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold text-[var(--qoreva-obsidian)] outline-none transition focus:border-[var(--qoreva-violet)] disabled:bg-[var(--qoreva-surface-muted)]"
                />

                {approvalModal.approval
                  .approverEmail ? (
                  <span className="mt-1 block text-xs font-semibold text-[var(--qoreva-muted)]">
                    {
                      approvalModal
                        .approval
                        .approverEmail
                    }
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  {approvalModal.decision ===
                  "Approved"
                    ? "Review Comment (optional)"
                    : approvalModal.decision ===
                        "RevisionRequired"
                      ? "Required Revisions"
                      : "Reason for Rejection"}
                </span>

                <textarea
                  value={
                    approvalModalComment
                  }
                  onChange={(event) =>
                    setApprovalModalComment(
                      event.target.value,
                    )
                  }
                  disabled={Boolean(
                    reviewingApprovalId,
                  )}
                  rows={4}
                  placeholder={
                    approvalModal.decision ===
                    "Approved"
                      ? "Add any approval comments."
                      : approvalModal.decision ===
                          "RevisionRequired"
                        ? "Describe what must be revised before approval."
                        : "Document why this MOC is being rejected."
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--qoreva-border)] bg-white px-3 py-3 text-sm font-semibold text-[var(--qoreva-obsidian)] outline-none transition focus:border-[var(--qoreva-violet)] disabled:bg-[var(--qoreva-surface-muted)]"
                />
              </label>

              {approvalModal.decision ===
              "Approved" ? (
                <>
                  <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-violet-faint)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                          Electronic Signature
                        </p>

                        <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                          Draw your signature below
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--qoreva-muted)]">
                          Use a mouse, finger, or stylus. Your signature is stored with the official MOC approval record.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          clearApprovalSignature
                        }
                        disabled={
                          Boolean(
                            reviewingApprovalId,
                          ) ||
                          approvalSignatureStrokes.length ===
                            0
                        }
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-obsidian)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Clear Signature
                      </button>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border-2 border-dashed border-[var(--qoreva-border-strong)] bg-white">
                      <svg
                        ref={
                          signaturePadRef
                        }
                        viewBox="0 0 1000 300"
                        preserveAspectRatio="none"
                        onPointerDown={
                          beginApprovalSignature
                        }
                        onPointerMove={
                          continueApprovalSignature
                        }
                        onPointerUp={
                          endApprovalSignature
                        }
                        onPointerCancel={
                          endApprovalSignature
                        }
                        onPointerLeave={(
                          event,
                        ) => {
                          if (
                            signatureDrawingRef.current
                          ) {
                            endApprovalSignature(
                              event,
                            );
                          }
                        }}
                        className="block h-44 w-full touch-none select-none bg-white sm:h-48"
                        aria-label="Draw approval signature"
                      >
                        <line
                          x1="80"
                          y1="240"
                          x2="920"
                          y2="240"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[var(--qoreva-border-strong)]"
                        />

                        {approvalSignatureStrokes.map(
                          (
                            stroke,
                            strokeIndex,
                          ) => {
                            if (
                              stroke.points.length ===
                              0
                            ) {
                              return null;
                            }

                            const path =
                              stroke.points
                                .map(
                                  (
                                    point,
                                    pointIndex,
                                  ) =>
                                    `${
                                      pointIndex ===
                                      0
                                        ? "M"
                                        : "L"
                                    } ${
                                      point.x *
                                      1000
                                    } ${
                                      point.y *
                                      300
                                    }`,
                                )
                                .join(
                                  " ",
                                );

                            return (
                              <path
                                key={
                                  strokeIndex
                                }
                                d={
                                  path
                                }
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[var(--qoreva-obsidian)]"
                              />
                            );
                          },
                        )}
                      </svg>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--qoreva-muted)]">
                        Signer:{" "}
                        {approvalSignerName ||
                          "Named approver"}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                          approvalSignatureStrokes.length >
                          0
                            ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                            : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
                        }`}
                      >
                        {approvalSignatureStrokes.length >
                        0
                          ? "Signature Captured"
                          : "Signature Required"}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4">
                    <input
                      type="checkbox"
                      checked={
                        approvalAttested
                      }
                      disabled={Boolean(
                        reviewingApprovalId,
                      )}
                      onChange={(event) =>
                        setApprovalAttested(
                          event.target.checked,
                        )
                      }
                      className="mt-1 h-5 w-5"
                    />

                    <span className="text-sm font-bold leading-6 text-[var(--qoreva-obsidian)]">
                      I confirm that I reviewed this Management of Change, understand the change, hazards, and controls, and approve the MOC as the named approver.
                    </span>
                  </label>
                </>
              ) : null}

              <div
                className={`rounded-xl border p-3 text-xs font-semibold leading-5 ${
                  approvalModal.decision ===
                  "Approved"
                    ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                    : approvalModal.decision ===
                        "RevisionRequired"
                      ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                      : "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                }`}
              >
                This decision becomes part of the official MOC audit history. Production authorization must verify the signed-in user against the configured named approver.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeMocApprovalModal
                  }
                  disabled={Boolean(
                    reviewingApprovalId,
                  )}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-5 py-3 text-sm font-black text-[var(--qoreva-obsidian)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void submitMocApprovalDecision()
                  }
                  disabled={
                    Boolean(
                      reviewingApprovalId,
                    ) ||
                    !approvalSignerName.trim() ||
                    (
                      approvalModal.decision ===
                        "Approved" &&
                      (
                        approvalSignatureStrokes.length ===
                          0 ||
                        !approvalAttested
                      )
                    ) ||
                    (
                      approvalModal.decision !==
                        "Approved" &&
                      !approvalModalComment.trim()
                    )
                  }
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
                    approvalModal.decision ===
                    "Approved"
                      ? "bg-[var(--qoreva-success)] text-white"
                      : approvalModal.decision ===
                          "RevisionRequired"
                        ? "border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                        : "bg-[var(--qoreva-danger)] text-white"
                  }`}
                >
                  {reviewingApprovalId
                    ? "Recording Decision..."
                    : approvalModal.decision ===
                        "Approved"
                      ? "Approve & Sign"
                      : approvalModal.decision ===
                          "RevisionRequired"
                        ? "Request Revision"
                        : "Reject MOC"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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

function isSignaturePayload(
  value: unknown,
): value is SignaturePayload {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as {
      format?: unknown;
      width?: unknown;
      height?: unknown;
      strokes?: unknown;
    };

  return (
    candidate.format ===
      "qoreva-signature-strokes-v1" &&
    typeof candidate.width ===
      "number" &&
    typeof candidate.height ===
      "number" &&
    Array.isArray(
      candidate.strokes,
    )
  );
}

function SignaturePreview({
  signatureData,
}: {
  signatureData: SignaturePayload;
}) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[#BDE8D4] bg-white p-3">
      <svg
        viewBox={`0 0 ${signatureData.width} ${signatureData.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-20 w-full"
        aria-label="Recorded MOC approval signature"
      >
        {signatureData.strokes.map(
          (
            stroke,
            strokeIndex,
          ) => {
            if (
              !Array.isArray(
                stroke.points,
              ) ||
              stroke.points.length ===
                0
            ) {
              return null;
            }

            const path =
              stroke.points
                .map(
                  (
                    point,
                    pointIndex,
                  ) =>
                    `${
                      pointIndex ===
                      0
                        ? "M"
                        : "L"
                    } ${
                      point.x *
                      signatureData.width
                    } ${
                      point.y *
                      signatureData.height
                    }`,
                )
                .join(
                  " ",
                );

            return (
              <path
                key={
                  strokeIndex
                }
                d={
                  path
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--qoreva-obsidian)]"
              />
            );
          },
        )}
      </svg>
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