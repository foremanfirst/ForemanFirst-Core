"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PlanType =
  | "PTP"
  | "JHA"
  | "JSA"
  | "SFMEA"
  | "Lift Plan"
  | "LOTO Plan"
  | "Excavation Plan"
  | "Confined Space Plan"
  | "Hot Work Plan"
  | "Other";

type PlanTypeDefinition = {
  type: PlanType;
  title: string;
  description: string;
  recommended?: boolean;
  category: string;
};

type ProjectOption = {
  id: string;
  tenantId: string;
  name: string;
  projectCode: string | null;
  companyId: string;
  clientName: string | null;
  status: string;
  location: string | null;
  city: string | null;
  state: string | null;

  company: {
    id: string;
    name: string;
  };
};

type ContractorOption = {
  id: string;
  name: string;
  legalName: string | null;
  contractorCode: string | null;
  companyId: string;
  projectId: string | null;
  trade: string | null;
  approvalStatus: string;
  complianceStatus: string;
  orientationStatus: string;

  company: {
    id: string;
    name: string;
  };

  project: {
    id: string;
    name: string;
    projectCode: string | null;
  } | null;
};

type PlanningOptionsResponse = {
  projects: ProjectOption[];
  contractors: ContractorOption[];
};

type PlanningRequirement = {
  id: string;
  documentType: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;
  sortOrder: number;
  status: {
    hasDocument: boolean;
    hasCurrentDocument: boolean;
    hasApprovedDocument: boolean;
    matchingDocumentIds: string[];
  };
};

type PlanningDocument = {
  id: string;
  projectId: string | null;
  documentType: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  effectiveDate: string | null;
  expirationDate: string | null;
  approvalStatus: string;
  reviewStatus: string;
  notes: string | null;
  aiProcessingStatus: string;
  aiDocumentType: string | null;
  aiConfidence: string | number | null;
  uploadedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  planningStatus: {
    isExpired: boolean;
    isAiReady: boolean;
    recommendedForAi: boolean;
  };
};

type PlanningRequirementsResponse = {
  project: {
    id: string;
    name: string;
    projectCode: string | null;
    clientName: string | null;
    company: {
      id: string;
      name: string;
    };
  };
  contractor: {
    id: string;
    name: string;
    legalName: string | null;
    trade: string | null;
    approvalStatus: string;
    complianceStatus: string;
  };
  requirements: PlanningRequirement[];
  documents: PlanningDocument[];
  summary: {
    totalRequirements: number;
    requiredRequirements: number;
    requirementsWithDocuments: number;
    requirementsWithApprovedDocuments: number;
    totalDocuments: number;
    aiReadyDocuments: number;
    recommendedAiDocuments: number;
    expiredDocuments: number;
  };
};

type WorkSequenceStep = {
  id: string;
  title: string;
  description: string;
};

const safetyCriticalCategories = [
  "LOTO / Energy Isolation",
  "Electrical",
  "Excavation / Trenching",
  "Confined Space",
  "Lifting / Rigging",
  "Work at Height",
  "Hot Work",
  "Mobile Equipment / Traffic",
  "Line Breaking / Stored Energy",
  "Other Safety-Critical Work",
] as const;


type PlanningAnswer = {
  value: string;
  notes: string;
};

type GuidedPlanningQuestion = {
  id: string;
  category: string;
  question: string;
  helpText: string;
  critical?: boolean;
};

type DetectedPlanningActivity = {
  id: string;
  activityCode: string;
  name: string;
  category: string;
  isHighRisk: boolean;
  matchedKeywords: string[];
  score: number;
  sourceType: string;
};

type DynamicPlanningQuestion = {
  id: string;
  questionCode: string;
  category: string;
  section: string | null;
  questionText: string;
  helpText: string | null;
  questionType: string;
  options: unknown;
  unit: string | null;
  isRequired: boolean;
  isCritical: boolean;
  sortOrder: number;
  sourceType: string;
};

type WorkStepPlanning = {
  hazards: string;
  controls: string;
  safetyCritical: boolean;
  riskLevel: "Low" | "Medium" | "High" | "";
};

type GeneratedDraftControlSuggestion = {
  text: string;

  source:
    | "User"
    | "Rule"
    | "Requirement"
    | "AI";

  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
};

type GeneratedDraftWorkStep = {
  sequence: number;
  title: string;
  description: string | null;

  suggestedHazards: string[];
  suggestedControls: string[];

  safetyCriticalSuggested: boolean;

  riskAttention:
    | "Normal"
    | "Elevated"
    | "HighAttention";

  source:
    | "User"
    | "Rule"
    | "Requirement"
    | "AI";

  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
};

type GeneratedPlanningDraft = {
  generatedAt: string;

  workSteps: GeneratedDraftWorkStep[];

  ppeSuggestions:
    GeneratedDraftControlSuggestion[];

  permitSuggestions:
    GeneratedDraftControlSuggestion[];

  emergencySuggestions:
    GeneratedDraftControlSuggestion[];

  stopWorkSuggestions:
    GeneratedDraftControlSuggestion[];

  requirementControlSuggestions:
    GeneratedDraftControlSuggestion[];

  reviewFlags: Array<{
    code: string;
    title: string;
    detail: string;

    severity:
      | "Info"
      | "Warning"
      | "Critical";
  }>;

  metadata: {
    activityCount: number;
    questionCount: number;
    requirementCount: number;
    sourceDocumentCount: number;
    generatorVersion: string;
  };
};

type PlanningQualityStatus =
  | "Pass"
  | "Warning"
  | "Action Required";

type PlanningQualityCheck = {
  id: string;
  title: string;
  detail: string;
  status: PlanningQualityStatus;
};

type ReviewConfirmationKey =
  | "scope"
  | "sequence"
  | "hazards"
  | "controls"
  | "risk"
  | "requirements"
  | "emergency";

type ReviewConfirmations = Record<
  ReviewConfirmationKey,
  boolean
>;

type ReviewCommentStatus =
  | "Open"
  | "Resolved";

type ReviewComment = {
  id: string;
  targetId: string;
  section: string;
  label: string;
  comment: string;
  status: ReviewCommentStatus;
  createdBy: string;
  createdAt: string;
  resolvedAt: string | null;
};

type SubmissionSignatureStatus =
  | "Pending"
  | "Signed";

type SubmissionSignature = {
  id: string;
  role: string;
  signerName: string;
  required: boolean;
  status: SubmissionSignatureStatus;
  signedAt: string | null;
  signatureDataUrl: string | null;
};

type EditablePlanningRecordResponse = {
  record?: {
    id: string;
    tenantId: string;
    companyId: string;
    projectId: string;
    contractorId: string | null;
    planType: string;
    title: string;
    status: string;
    revisionNumber: number;
    responsibleSupervisor: string | null;
    plannedStartDate: string | null;
    workLocation: string | null;
    crewSize: number | null;
    shift: string | null;
    scopeDescription: string | null;
    equipmentTools: string | null;
    materialsChemicals: string | null;
    adjacentWork: string | null;
    specialConditions: string | null;
    requiredPpe: string | null;
    requiredPermits: string | null;
    emergencyPlan: string | null;
    stopWorkTriggers: string | null;
    planningNotes: string | null;
    qualityScore: number;
    workSteps: Array<{
      id: string;
      sequence: number;
      title: string;
      description: string | null;
      hazards: string | null;
      controls: string | null;
      safetyCritical: boolean;
      riskLevel: string | null;
    }>;
    questionResponses: Array<{
      questionId: string;
      category: string;
      responseValue: string | null;
      notes: string | null;
    }>;
    sourceDocuments: Array<{
      contractorDocumentId: string | null;
      isSelected: boolean;
    }>;
    revisions: Array<{
      revisionNumber: number;
      snapshot: {
        scope?: {
          safetyCriticalCategories?: string[];
        };
        sourceContext?: {
          selectedContractorDocumentIds?: string[];
        };
      } | null;
    }>;
  };
  message?: string;
};

const corePlanningQuestions: GuidedPlanningQuestion[] = [
  {
    id: "core-prejob",
    category: "Pre-Job Readiness",
    question:
      "Has the crew reviewed the scope, work sequence, and changing site conditions before work begins?",
    helpText:
      "Confirm the crew understands the planned work and that conditions match the plan.",
    critical: true,
  },
  {
    id: "core-qualified",
    category: "Pre-Job Readiness",
    question:
      "Are all required competent, qualified, or authorized persons identified for this work?",
    helpText:
      "Consider operator qualifications, competent persons, qualified electrical workers, rigging roles, attendants, and other required roles.",
    critical: true,
  },
  {
    id: "core-permits",
    category: "Permits & Authorizations",
    question:
      "Have all required permits, approvals, notifications, and owner/project authorizations been identified?",
    helpText:
      "Examples may include excavation, hot work, confined space, energized work, lift, line break, or project-specific approvals.",
    critical: true,
  },
  {
    id: "core-ppe",
    category: "PPE",
    question:
      "Has task-specific PPE been identified beyond the project minimum PPE?",
    helpText:
      "Consider respiratory protection, face shields, arc-rated PPE, hearing protection, chemical gloves, fall protection, and specialty PPE.",
  },
  {
    id: "core-emergency",
    category: "Emergency Planning",
    question:
      "Does the crew know the task-specific emergency response, stop-work triggers, and communication method?",
    helpText:
      "Address foreseeable emergencies such as utility strikes, fire, injury, equipment incident, atmospheric alarm, spill, or rescue.",
    critical: true,
  },
  {
    id: "core-access",
    category: "Work Area Control",
    question:
      "Are access, barricades, exclusion zones, housekeeping, and interaction with other work adequately controlled?",
    helpText:
      "Consider pedestrians, deliveries, adjacent trades, traffic routes, restricted areas, and simultaneous operations.",
  },
];

const categoryQuestionLibrary: Record<
  string,
  GuidedPlanningQuestion[]
> = {
  "LOTO / Energy Isolation": [
    {
      id: "loto-sources",
      category: "LOTO / Energy Isolation",
      question:
        "Have all hazardous energy sources and stored energy been identified before isolation?",
      helpText:
        "Consider electrical, mechanical, hydraulic, pneumatic, thermal, gravity, pressure, chemical, and stored energy.",
      critical: true,
    },
    {
      id: "loto-zero",
      category: "LOTO / Energy Isolation",
      question:
        "Will zero-energy state be verified before work begins and after any condition that could affect isolation?",
      helpText:
        "Verification must follow the applicable energy-control procedure and be performed by qualified/authorized personnel.",
      critical: true,
    },
    {
      id: "loto-group",
      category: "LOTO / Energy Isolation",
      question:
        "If multiple workers or shifts are involved, is group lockout, lockbox, transfer, and shift-change control addressed?",
      helpText:
        "Document how personal protection remains continuous during crew or shift transitions.",
      critical: true,
    },
  ],
  Electrical: [
    {
      id: "elec-deenergize",
      category: "Electrical",
      question:
        "Can the electrical work be performed de-energized?",
      helpText:
        "De-energized work should be the default unless an approved exception and applicable energized-work process exists.",
      critical: true,
    },
    {
      id: "elec-test",
      category: "Electrical",
      question:
        "Are voltage verification, test instrument suitability, and qualified-person requirements addressed?",
      helpText:
        "Confirm the meter/tester is appropriate and the verification method is defined.",
      critical: true,
    },
    {
      id: "elec-boundaries",
      category: "Electrical",
      question:
        "Are approach boundaries, arc-flash/shock protection, barricades, and required PPE identified?",
      helpText:
        "Use the applicable electrical safety program, labels/studies, and owner requirements.",
      critical: true,
    },
  ],
  "Excavation / Trenching": [
    {
      id: "exc-locates",
      category: "Excavation / Trenching",
      question:
        "Are underground utilities located, verified, marked, and positively identified before excavation begins?",
      helpText:
        "Include required locate tickets, drawings, scanning, potholing/daylighting, and clearance requirements.",
      critical: true,
    },
    {
      id: "exc-protection",
      category: "Excavation / Trenching",
      question:
        "Has the competent person determined the protective system, spoil setback, access/egress, and daily inspection requirements?",
      helpText:
        "The protective method must match actual soil, depth, water, loading, and site conditions.",
      critical: true,
    },
    {
      id: "exc-mobile",
      category: "Excavation / Trenching",
      question:
        "Are mobile-equipment approach, edge protection, spotter needs, and swing-radius hazards controlled?",
      helpText:
        "Address equipment interaction with workers and excavation edges.",
      critical: true,
    },
  ],
  "Confined Space": [
    {
      id: "cs-classification",
      category: "Confined Space",
      question:
        "Has the space been properly evaluated and classified before entry?",
      helpText:
        "Determine whether it is permit-required or non-permit under the applicable program and project rules.",
      critical: true,
    },
    {
      id: "cs-atmosphere",
      category: "Confined Space",
      question:
        "Are atmospheric testing, ventilation, continuous monitoring, and alarm limits defined?",
      helpText:
        "Testing must address oxygen, flammables, toxics, and task-specific contaminants.",
      critical: true,
    },
    {
      id: "cs-rescue",
      category: "Confined Space",
      question:
        "Is the rescue method, attendant coverage, communication, and retrieval equipment established?",
      helpText:
        "Do not rely on an undefined emergency response.",
      critical: true,
    },
  ],
  "Lifting / Rigging": [
    {
      id: "lift-load",
      category: "Lifting / Rigging",
      question:
        "Are the load weight, center of gravity, lifting points, rigging capacity, and equipment capacity verified?",
      helpText:
        "Do not estimate critical lifting data when verified information is required.",
      critical: true,
    },
    {
      id: "lift-people",
      category: "Lifting / Rigging",
      question:
        "Are qualified operator, rigger, signal-person, and communication requirements addressed?",
      helpText:
        "Roles should be clear before the lift starts.",
      critical: true,
    },
    {
      id: "lift-zone",
      category: "Lifting / Rigging",
      question:
        "Is the fall zone / suspended-load exclusion area controlled and are nearby obstructions or power lines addressed?",
      helpText:
        "Keep personnel out of hazardous areas and account for the full travel path.",
      critical: true,
    },
  ],
  "Work at Height": [
    {
      id: "height-system",
      category: "Work at Height",
      question:
        "Is the correct fall-prevention or fall-arrest system selected for the exposure?",
      helpText:
        "Consider guardrails, scaffolds, lifts, restraint, personal fall arrest, and project-specific thresholds.",
      critical: true,
    },
    {
      id: "height-anchor",
      category: "Work at Height",
      question:
        "Are anchorage, connectors, inspection, clearance, and rescue requirements addressed?",
      helpText:
        "Confirm the system can function as intended for the actual work location.",
      critical: true,
    },
  ],
  "Hot Work": [
    {
      id: "hot-permit",
      category: "Hot Work",
      question:
        "Is a hot-work permit or equivalent authorization required and obtained before work starts?",
      helpText:
        "Apply owner/project hot-work requirements and location restrictions.",
      critical: true,
    },
    {
      id: "hot-fire",
      category: "Hot Work",
      question:
        "Are combustibles, fire protection, fire watch, spark containment, and post-work monitoring addressed?",
      helpText:
        "Consider adjacent levels, concealed spaces, and changing conditions.",
      critical: true,
    },
  ],
  "Mobile Equipment / Traffic": [
    {
      id: "mobile-plan",
      category: "Mobile Equipment / Traffic",
      question:
        "Are travel paths, pedestrian separation, backing, spotters, blind spots, and traffic controls defined?",
      helpText:
        "Plan the interaction between mobile equipment, public traffic, deliveries, and workers.",
      critical: true,
    },
    {
      id: "mobile-inspection",
      category: "Mobile Equipment / Traffic",
      question:
        "Are operator authorization, pre-use inspection, seat-belt, and equipment-condition requirements addressed?",
      helpText:
        "Equipment must be suitable for the task and site conditions.",
    },
  ],
  "Line Breaking / Stored Energy": [
    {
      id: "line-identify",
      category: "Line Breaking / Stored Energy",
      question:
        "Are the contents, pressure, temperature, chemical exposure, and stored energy verified before opening the system?",
      helpText:
        "Do not rely solely on labels or assumptions when verification is required.",
      critical: true,
    },
    {
      id: "line-isolate",
      category: "Line Breaking / Stored Energy",
      question:
        "Are isolation, drain/vent/purge, zero-energy verification, PPE, and spill/release controls established?",
      helpText:
        "Address the credible release scenario before line breaking begins.",
      critical: true,
    },
  ],
  "Other Safety-Critical Work": [
    {
      id: "other-critical",
      category: "Other Safety-Critical Work",
      question:
        "Have the credible serious-injury/fatality exposures and the controls that prevent them been specifically identified?",
      helpText:
        "Describe the critical exposure and the control that must not fail.",
      critical: true,
    },
  ],
};

const planTypes: PlanTypeDefinition[] = [
  {
    type: "PTP",
    title: "Pre-Task Plan",
    description:
      "Guided field planning for work sequence, hazards, controls, safety-critical steps, PPE, permits, and emergency planning.",
    recommended: true,
    category: "Field Planning",
  },
  {
    type: "JHA",
    title: "Job Hazard Analysis",
    description:
      "Break work into job steps and identify hazards and controls for each activity.",
    category: "Field Planning",
  },
  {
    type: "JSA",
    title: "Job Safety Analysis",
    description:
      "Document the work sequence, hazards, and required safeguards before work begins.",
    category: "Field Planning",
  },
  {
    type: "SFMEA",
    title: "Safety FMEA",
    description:
      "Evaluate potential failure modes, consequences, risk, and preventive controls.",
    category: "Risk Planning",
  },
  {
    type: "LOTO Plan",
    title: "LOTO Plan",
    description:
      "Plan hazardous-energy isolation, verification, group lockout, and restoration requirements.",
    category: "High-Risk Work",
  },
  {
    type: "Lift Plan",
    title: "Lift Plan",
    description:
      "Plan lifting operations, equipment, rigging, load considerations, personnel, and critical controls.",
    category: "High-Risk Work",
  },
  {
    type: "Excavation Plan",
    title: "Excavation Plan",
    description:
      "Plan utility verification, soil conditions, protective systems, access, equipment, and excavation controls.",
    category: "High-Risk Work",
  },
  {
    type: "Confined Space Plan",
    title: "Confined Space Plan",
    description:
      "Plan entry conditions, atmospheric testing, attendants, rescue, isolation, and permit requirements.",
    category: "High-Risk Work",
  },
  {
    type: "Hot Work Plan",
    title: "Hot Work Plan",
    description:
      "Plan ignition-source controls, fire prevention, permits, fire watch, and surrounding-area protection.",
    category: "High-Risk Work",
  },
  {
    type: "Other",
    title: "Other Planning Document",
    description:
      "Start a configurable planning workflow for another company, project, or owner-required document.",
    category: "Other",
  },
];

const wizardSteps = [
  {
    number: 1,
    shortTitle: "Plan Type",
  },
  {
    number: 2,
    shortTitle: "Assignment",
  },
  {
    number: 3,
    shortTitle: "Requirements",
  },
  {
    number: 4,
    shortTitle: "Scope",
  },
  {
    number: 5,
    shortTitle: "Planning",
  },
  {
    number: 6,
    shortTitle: "Build",
  },
  {
    number: 7,
    shortTitle: "Review",
  },
  {
    number: 8,
    shortTitle: "Submit",
  },
];

export default function CreatePlanningPage() {
  const [currentStep, setCurrentStep] =
    useState(1);

  const [
    planningRecordId,
    setPlanningRecordId,
  ] = useState<string | null>(null);

  const [
    editPlanningRecordId,
    setEditPlanningRecordId,
  ] = useState<string | null>(null);

  const [
    editModeLoading,
    setEditModeLoading,
  ] = useState(false);

  const [
    editModeError,
    setEditModeError,
  ] = useState("");

  const editHydrationStartedRef =
    useRef(false);

  const [
    planningDraftSaving,
    setPlanningDraftSaving,
  ] = useState(false);

  const [
    draftBuildSaving,
    setDraftBuildSaving,
  ] = useState(false);

  const [
    generatedPlanningDraft,
    setGeneratedPlanningDraft,
  ] = useState<GeneratedPlanningDraft | null>(
    null,
  );

  const [
    qualifiedReviewSaving,
    setQualifiedReviewSaving,
  ] = useState(false);

  const [
    submissionSaving,
    setSubmissionSaving,
  ] = useState(false);

  const [
    planningRevisionNumber,
    setPlanningRevisionNumber,
  ] = useState(1);

  const [
    selectedPlanType,
    setSelectedPlanType,
  ] = useState<PlanType | null>(
    null,
  );

  const [search, setSearch] =
    useState("");

  const [projects, setProjects] =
    useState<ProjectOption[]>([]);

  const [
    contractors,
    setContractors,
  ] =
    useState<
      ContractorOption[]
    >([]);

  const [
    optionsLoading,
    setOptionsLoading,
  ] = useState(true);

  const [
    optionsError,
    setOptionsError,
  ] = useState("");

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");

  const [
    selectedContractorId,
    setSelectedContractorId,
  ] = useState("");

  const [
    responsibleSupervisor,
    setResponsibleSupervisor,
  ] = useState("");

  const [
    plannedStartDate,
    setPlannedStartDate,
  ] = useState("");

  const [
    workLocation,
    setWorkLocation,
  ] = useState("");

  const [
    stepError,
    setStepError,
  ] = useState("");

  const [
    requirementsData,
    setRequirementsData,
  ] = useState<PlanningRequirementsResponse | null>(null);

  const [
    requirementsLoading,
    setRequirementsLoading,
  ] = useState(false);

  const [
    requirementsError,
    setRequirementsError,
  ] = useState("");

  const [
    selectedDocumentIds,
    setSelectedDocumentIds,
  ] = useState<string[]>([]);

  const [
    planSpecificFiles,
    setPlanSpecificFiles,
  ] = useState<File[]>([]);

  const [scopeTitle, setScopeTitle] =
    useState("");

  const [
    scopeDescription,
    setScopeDescription,
  ] = useState("");

  const [crewSize, setCrewSize] =
    useState("");

  const [shift, setShift] =
    useState("Day");

  const [
    equipmentTools,
    setEquipmentTools,
  ] = useState("");

  const [
    materialsChemicals,
    setMaterialsChemicals,
  ] = useState("");

  const [
    adjacentWork,
    setAdjacentWork,
  ] = useState("");

  const [
    specialConditions,
    setSpecialConditions,
  ] = useState("");

  const [
    selectedSafetyCriticalCategories,
    setSelectedSafetyCriticalCategories,
  ] = useState<string[]>([]);

  const [
    workSequence,
    setWorkSequence,
  ] = useState<WorkSequenceStep[]>([
    {
      id: "step-1",
      title: "",
      description: "",
    },
  ]);


  const [
    planningAnswers,
    setPlanningAnswers,
  ] = useState<Record<string, PlanningAnswer>>({});

  const [
    detectedActivities,
    setDetectedActivities,
  ] = useState<DetectedPlanningActivity[]>([]);

  const [
    confirmedActivityCodes,
    setConfirmedActivityCodes,
  ] = useState<string[]>([]);

  const [
    activityDetectionLoading,
    setActivityDetectionLoading,
  ] = useState(false);

  const [
    activityDetectionError,
    setActivityDetectionError,
  ] = useState("");

  const [
    guidedPlanningQuestions,
    setGuidedPlanningQuestions,
  ] = useState<DynamicPlanningQuestion[]>([]);

  const [
    guidedQuestionsLoading,
    setGuidedQuestionsLoading,
  ] = useState(false);

  const [
    guidedQuestionsError,
    setGuidedQuestionsError,
  ] = useState("");

  const [
    workStepPlanning,
    setWorkStepPlanning,
  ] = useState<Record<string, WorkStepPlanning>>({});

  const [
    requiredPpe,
    setRequiredPpe,
  ] = useState("");

  const [
    requiredPermits,
    setRequiredPermits,
  ] = useState("");

  const [
    emergencyPlan,
    setEmergencyPlan,
  ] = useState("");

  const [
    stopWorkTriggers,
    setStopWorkTriggers,
  ] = useState("");

  const [
    planningNotes,
    setPlanningNotes,
  ] = useState("");

  const [
    draftGenerated,
    setDraftGenerated,
  ] = useState(false);

  const [
    reviewerName,
    setReviewerName,
  ] = useState("");

  const [
    reviewerRole,
    setReviewerRole,
  ] = useState("");

  const [
    reviewNotes,
    setReviewNotes,
  ] = useState("");

  const [
    reviewConfirmations,
    setReviewConfirmations,
  ] = useState<ReviewConfirmations>({
    scope: false,
    sequence: false,
    hazards: false,
    controls: false,
    risk: false,
    requirements: false,
    emergency: false,
  });

  const [
    reviewComments,
    setReviewComments,
  ] = useState<ReviewComment[]>([]);

  const [
    activeReviewTargetId,
    setActiveReviewTargetId,
  ] = useState<string | null>(null);

  const [
    reviewCommentDraft,
    setReviewCommentDraft,
  ] = useState("");

  const [
    submissionSignatures,
    setSubmissionSignatures,
  ] = useState<SubmissionSignature[]>([]);

  const [
    additionalApproverRole,
    setAdditionalApproverRole,
  ] = useState("");

  const [
    additionalApproverName,
    setAdditionalApproverName,
  ] = useState("");

  const [
    submissionAcknowledged,
    setSubmissionAcknowledged,
  ] = useState(false);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submittedAt,
    setSubmittedAt,
  ] = useState<string | null>(null);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const existingRecordId =
      params.get(
        "planningRecordId",
      );

    if (existingRecordId) {
      setEditPlanningRecordId(
        existingRecordId,
      );
    }
  }, []);

  useEffect(() => {
    if (
      !editPlanningRecordId ||
      editHydrationStartedRef.current
    ) {
      return;
    }

    editHydrationStartedRef.current =
      true;

    let cancelled = false;

    async function hydrateExistingDraft() {
      setEditModeLoading(true);
      setEditModeError("");
      setStepError("");

      try {
        const response = await fetch(
          `/api/planning/${editPlanningRecordId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as
            EditablePlanningRecordResponse;

        if (
          !response.ok ||
          !data.record
        ) {
          throw new Error(
            data.message ||
              "Unable to load the planning revision for editing.",
          );
        }

        const record = data.record;

        if (
          record.status !== "Draft"
        ) {
          throw new Error(
            `Only Draft planning records can be edited. This record is currently ${record.status}.`,
          );
        }

        if (
          !planTypes.some(
            (definition) =>
              definition.type ===
              record.planType,
          )
        ) {
          throw new Error(
            `The plan type ${record.planType} is not supported by this Planning editor.`,
          );
        }

        const previousRevision =
          record.revisions.find(
            (revision) =>
              revision.revisionNumber ===
              record.revisionNumber - 1,
          ) ?? null;

        const snapshotCategories =
          previousRevision?.snapshot
            ?.scope
            ?.safetyCriticalCategories ??
          [];

        const inferredCategories =
          Array.from(
            new Set(
              record.questionResponses
                .map(
                  (response) =>
                    response.category,
                )
                .filter((category) =>
                  (
                    safetyCriticalCategories as readonly string[]
                  ).includes(
                    category,
                  ),
                ),
            ),
          );

        const restoredCategories =
          snapshotCategories.length > 0
            ? snapshotCategories.filter(
                (category) =>
                  (
                    safetyCriticalCategories as readonly string[]
                  ).includes(
                    category,
                  ),
              )
            : inferredCategories;

        const restoredWorkSequence =
          record.workSteps.length > 0
            ? record.workSteps.map(
                (step) => ({
                  id: step.id,
                  title: step.title,
                  description:
                    step.description ??
                    "",
                }),
              )
            : [
                {
                  id: `step-${Date.now()}`,
                  title: "",
                  description: "",
                },
              ];

        const restoredWorkPlanning:
          Record<
            string,
            WorkStepPlanning
          > = {};

        record.workSteps.forEach(
          (step) => {
            restoredWorkPlanning[
              step.id
            ] = {
              hazards:
                step.hazards ?? "",
              controls:
                step.controls ?? "",
              safetyCritical:
                step.safetyCritical,
              riskLevel:
                step.riskLevel ===
                  "Low" ||
                step.riskLevel ===
                  "Medium" ||
                step.riskLevel ===
                  "High"
                  ? step.riskLevel
                  : "",
            };
          },
        );

        const restoredAnswers:
          Record<
            string,
            PlanningAnswer
          > = {};

        record.questionResponses.forEach(
          (response) => {
            restoredAnswers[
              response.questionId
            ] = {
              value:
                response.responseValue ?? "",
              notes:
                response.notes ?? "",
            };
          },
        );

        const persistedSourceIds =
          record.sourceDocuments
            .filter(
              (source) =>
                source.isSelected &&
                Boolean(
                  source.contractorDocumentId,
                ),
            )
            .map(
              (source) =>
                source.contractorDocumentId as string,
            );

        const snapshotSourceIds =
          previousRevision?.snapshot
            ?.sourceContext
            ?.selectedContractorDocumentIds ??
          [];

        if (cancelled) {
          return;
        }

        setPlanningRecordId(
          record.id,
        );
        setPlanningRevisionNumber(
          record.revisionNumber,
        );
        setSelectedPlanType(
          record.planType as PlanType,
        );
        setSelectedProjectId(
          record.projectId,
        );
        setSelectedContractorId(
          record.contractorId ?? "",
        );
        setResponsibleSupervisor(
          record.responsibleSupervisor ??
            "",
        );
        setPlannedStartDate(
          toDateInputValue(
            record.plannedStartDate,
          ),
        );
        setWorkLocation(
          record.workLocation ?? "",
        );
        setScopeTitle(
          record.title ?? "",
        );
        setScopeDescription(
          record.scopeDescription ??
            "",
        );
        setCrewSize(
          record.crewSize === null
            ? ""
            : String(
                record.crewSize,
              ),
        );
        setShift(
          record.shift ?? "Day",
        );
        setEquipmentTools(
          record.equipmentTools ??
            "",
        );
        setMaterialsChemicals(
          record.materialsChemicals ??
            "",
        );
        setAdjacentWork(
          record.adjacentWork ?? "",
        );
        setSpecialConditions(
          record.specialConditions ??
            "",
        );
        setSelectedSafetyCriticalCategories(
          restoredCategories,
        );
        setWorkSequence(
          restoredWorkSequence,
        );
        setWorkStepPlanning(
          restoredWorkPlanning,
        );
        setPlanningAnswers(
          restoredAnswers,
        );
        setRequiredPpe(
          record.requiredPpe ?? "",
        );
        setRequiredPermits(
          record.requiredPermits ??
            "",
        );
        setEmergencyPlan(
          record.emergencyPlan ?? "",
        );
        setStopWorkTriggers(
          record.stopWorkTriggers ??
            "",
        );
        setPlanningNotes(
          record.planningNotes ?? "",
        );
        setSelectedDocumentIds(
          persistedSourceIds.length > 0
            ? persistedSourceIds
            : snapshotSourceIds,
        );

        setDraftGenerated(false);
      setGeneratedPlanningDraft(null);
        setReviewerName("");
        setReviewerRole("");
        setReviewNotes("");
        setReviewConfirmations({
          scope: false,
          sequence: false,
          hazards: false,
          controls: false,
          risk: false,
          requirements: false,
          emergency: false,
        });
        setReviewComments([]);
        setSubmissionSignatures([]);
        setSubmissionAcknowledged(false);
        setSubmitted(false);
        setSubmittedAt(null);

        setCurrentStep(4);

        if (
          record.contractorId
        ) {
          const requirementParams =
            new URLSearchParams({
              projectId:
                record.projectId,
              contractorId:
                record.contractorId,
            });

          const requirementsResponse =
            await fetch(
              `/api/planning/requirements?${requirementParams.toString()}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const requirementsResult =
            (await requirementsResponse.json()) as
              | PlanningRequirementsResponse
              | {
                  message?: string;
                };

          if (
            requirementsResponse.ok &&
            "requirements" in
              requirementsResult &&
            "documents" in
              requirementsResult &&
            !cancelled
          ) {
            setRequirementsData(
              requirementsResult,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load the planning revision for editing.";

          setEditModeError(
            message,
          );
          setStepError(
            message,
          );
        }
      } finally {
        if (!cancelled) {
          setEditModeLoading(false);
        }
      }
    }

    void hydrateExistingDraft();

    return () => {
      cancelled = true;
    };
  }, [editPlanningRecordId]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");

      try {
        const response =
          await fetch(
            "/api/planning/options",
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const data =
          (await response.json()) as
            | PlanningOptionsResponse
            | {
                message?: string;
              };

        if (!response.ok) {
          throw new Error(
            "message" in data
              ? data.message ||
                  "Unable to load planning options."
              : "Unable to load planning options.",
          );
        }

        if (
          !cancelled &&
          "projects" in data &&
          "contractors" in
            data
        ) {
          setProjects(
            data.projects,
          );

          setContractors(
            data.contractors,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setOptionsError(
            error instanceof Error
              ? error.message
              : "Unable to load planning options.",
          );
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(
            false,
          );
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlanTypes =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return planTypes;
      }

      return planTypes.filter(
        (planType) =>
          [
            planType.type,
            planType.title,
            planType.description,
            planType.category,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      );
    }, [search]);

  const selectedDefinition =
    selectedPlanType
      ? planTypes.find(
          (planType) =>
            planType.type ===
            selectedPlanType,
        ) ?? null
      : null;

  const selectedProject =
    projects.find(
      (project) =>
        project.id ===
        selectedProjectId,
    );

  const projectContractors =
    useMemo(() => {
      if (
        !selectedProjectId
      ) {
        return [];
      }

      return contractors.filter(
        (contractor) =>
          contractor.projectId ===
          selectedProjectId,
      );
    }, [
      contractors,
      selectedProjectId,
    ]);

  const selectedContractor =
    projectContractors.find(
      (contractor) =>
        contractor.id ===
        selectedContractorId,
    );


  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      async function loadGuidedQuestions() {
        if (!selectedProject) {
          return;
        }

        setGuidedQuestionsLoading(true);
        setGuidedQuestionsError("");

        try {
          const answers = Object.fromEntries(
            (
              Object.entries(planningAnswers) as Array<
                [string, PlanningAnswer]
              >
            ).map(([questionCode, answer]) => [
              questionCode,
              answer.value,
            ]),
          );

          const response = await fetch(
            "/api/planning/question-evaluation",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tenantId: selectedProject.tenantId,
                activityCodes: confirmedActivityCodes,
                answers,
              }),
            },
          );

          const data = (await response.json()) as {
            questions?: DynamicPlanningQuestion[];
            message?: string;
          };

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load guided planning questions.",
            );
          }

          if (!cancelled) {
            setGuidedPlanningQuestions(
              data.questions ?? [],
            );
          }
        } catch (error) {
          if (!cancelled) {
            setGuidedQuestionsError(
              error instanceof Error
                ? error.message
                : "Unable to load guided planning questions.",
            );
          }
        } finally {
          if (!cancelled) {
            setGuidedQuestionsLoading(false);
          }
        }
      }

      void loadGuidedQuestions();
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    confirmedActivityCodes,
    planningAnswers,
    selectedProject,
  ]);

  const planningProgress =
    useMemo(() => {
      if (guidedPlanningQuestions.length === 0) {
        return {
          answered: 0,
          total: 0,
          percent: 0,
          criticalUnresolved: 0,
        };
      }

      const answered =
        guidedPlanningQuestions.filter(
          (question) =>
            Boolean(
              planningAnswers[
                question.questionCode
              ]?.value.trim(),
            ),
        ).length;

      const criticalUnresolved =
        guidedPlanningQuestions.filter(
          (question) =>
            question.isCritical &&
            !planningAnswers[
              question.questionCode
            ]?.value.trim(),
        ).length;

      return {
        answered,
        total: guidedPlanningQuestions.length,
        percent: Math.round(
          (answered /
            guidedPlanningQuestions.length) *
            100,
        ),
        criticalUnresolved,
      };
    }, [
      guidedPlanningQuestions,
      planningAnswers,
    ]);


  const activeWorkSteps = useMemo(
    () =>
      workSequence.filter(
        (step) =>
          step.title.trim() ||
          step.description.trim(),
      ),
    [workSequence],
  );

  const highRiskSteps = useMemo(
    () =>
      activeWorkSteps.filter(
        (step) =>
          workStepPlanning[step.id]?.riskLevel ===
          "High",
      ),
    [activeWorkSteps, workStepPlanning],
  );

  const confirmedHighRiskActivities = useMemo(
    () =>
      detectedActivities.filter(
        (activity) =>
          activity.isHighRisk &&
          confirmedActivityCodes.includes(
            activity.activityCode,
          ),
      ),
    [detectedActivities, confirmedActivityCodes],
  );

  const planningQualityChecks =
    useMemo<PlanningQualityCheck[]>(() => {
      const checks: PlanningQualityCheck[] = [];

      checks.push({
        id: "assignment",
        title: "Work assignment",
        detail:
          selectedProject &&
          selectedContractor &&
          responsibleSupervisor.trim()
            ? "Project, contractor, and responsible supervisor are identified."
            : "Project, contractor, or responsible supervisor information is incomplete.",
        status:
          selectedProject &&
          selectedContractor &&
          responsibleSupervisor.trim()
            ? "Pass"
            : "Action Required",
      });

      checks.push({
        id: "scope",
        title: "Scope and sequence",
        detail:
          scopeTitle.trim() &&
          scopeDescription.trim() &&
          activeWorkSteps.length > 0
            ? `${activeWorkSteps.length} work step${
                activeWorkSteps.length === 1
                  ? ""
                  : "s"
              } defined with a documented scope.`
            : "The task scope or work sequence is incomplete.",
        status:
          scopeTitle.trim() &&
          scopeDescription.trim() &&
          activeWorkSteps.length > 0
            ? "Pass"
            : "Action Required",
      });

      const incompleteHazardSteps =
        activeWorkSteps.filter((step) => {
          const planning =
            workStepPlanning[step.id];

          return (
            !planning?.hazards.trim() ||
            !planning?.controls.trim()
          );
        });

      checks.push({
        id: "hazards-controls",
        title: "Hazards and controls",
        detail:
          incompleteHazardSteps.length === 0
            ? "Every work step includes documented hazards and controls."
            : `${incompleteHazardSteps.length} work step${
                incompleteHazardSteps.length === 1
                  ? ""
                  : "s"
              } still need hazards or controls.`,
        status:
          incompleteHazardSteps.length === 0
            ? "Pass"
            : "Action Required",
      });

      const unratedSteps =
        activeWorkSteps.filter(
          (step) =>
            !workStepPlanning[step.id]?.riskLevel,
        );

      checks.push({
        id: "risk-levels",
        title: "Work-step risk ratings",
        detail:
          unratedSteps.length === 0
            ? `${activeWorkSteps.length} work step${
                activeWorkSteps.length === 1
                  ? ""
                  : "s"
              } rated Low, Medium, or High.`
            : `${unratedSteps.length} work step${
                unratedSteps.length === 1
                  ? ""
                  : "s"
              } still need a risk rating.`,
        status:
          unratedSteps.length === 0
            ? "Pass"
            : "Action Required",
      });

      const highRiskNotCritical =
        highRiskSteps.filter(
          (step) =>
            !workStepPlanning[step.id]
              ?.safetyCritical,
        );

      checks.push({
        id: "high-risk",
        title: "High-risk verification",
        detail:
          highRiskSteps.length === 0
            ? "No work steps are currently rated High."
            : highRiskNotCritical.length === 0
              ? `${highRiskSteps.length} High-risk work step${
                  highRiskSteps.length === 1
                    ? " is"
                    : "s are"
                } also identified as safety-critical.`
              : `${highRiskNotCritical.length} High-risk step${
                  highRiskNotCritical.length === 1
                    ? " is"
                    : "s are"
                } not marked as safety-critical. Confirm this is intentional during qualified review.`,
        status:
          highRiskSteps.length === 0 ||
          highRiskNotCritical.length === 0
            ? "Pass"
            : "Warning",
      });

      checks.push({
        id: "critical-questions",
        title: "Safety-critical planning questions",
        detail:
          planningProgress.criticalUnresolved === 0
            ? "All applicable safety-critical planning questions have a response."
            : `${planningProgress.criticalUnresolved} safety-critical question${
                planningProgress.criticalUnresolved === 1
                  ? ""
                  : "s"
              } remain unanswered.`,
        status:
          planningProgress.criticalUnresolved === 0
            ? "Pass"
            : "Action Required",
      });

      checks.push({
        id: "ppe",
        title: "Task-specific PPE",
        detail: requiredPpe.trim()
          ? "Task-specific PPE has been documented."
          : "No task-specific PPE is documented. Confirm project minimum PPE is sufficient.",
        status: requiredPpe.trim()
          ? "Pass"
          : "Warning",
      });

      checks.push({
        id: "permits",
        title: "Permits and authorizations",
        detail: requiredPermits.trim()
          ? "Required permits and authorizations have been identified."
          : confirmedHighRiskActivities.length > 0
            ? "High-risk work activities are confirmed, but no permits or authorizations are listed. Confirm none are required."
            : "No task-specific permits or authorizations are listed.",
        status: requiredPermits.trim()
          ? "Pass"
          : "Warning",
      });

      checks.push({
        id: "emergency",
        title: "Task-specific emergency plan",
        detail: emergencyPlan.trim()
          ? "Task-specific emergency response is documented."
          : "The task-specific emergency response is missing.",
        status: emergencyPlan.trim()
          ? "Pass"
          : "Action Required",
      });

      checks.push({
        id: "stop-work",
        title: "Stop-work triggers",
        detail: stopWorkTriggers.trim()
          ? "Conditions requiring stop-work and reassessment are documented."
          : "No task-specific stop-work triggers are documented.",
        status: stopWorkTriggers.trim()
          ? "Pass"
          : "Warning",
      });

      const requiredRequirementCount =
        requirementsData?.summary
          .requiredRequirements ?? 0;

      const approvedRequirementCount =
        requirementsData?.summary
          .requirementsWithApprovedDocuments ?? 0;

      checks.push({
        id: "requirements",
        title: "Project requirement status",
        detail:
          requiredRequirementCount === 0
            ? "No required contractor documents are configured for this project."
            : approvedRequirementCount >=
                requiredRequirementCount
              ? "All configured required contractor-document requirements have an approved match."
              : `${approvedRequirementCount} of ${requiredRequirementCount} required contractor-document requirements have an approved match. This does not prevent drafting, but it should be resolved before final submission when applicable.`,
        status:
          requiredRequirementCount === 0 ||
          approvedRequirementCount >=
            requiredRequirementCount
            ? "Pass"
            : "Warning",
      });

      checks.push({
        id: "sources",
        title: "Planning source documents",
        detail:
          selectedDocumentIds.length > 0
            ? `${selectedDocumentIds.length} approved/current contractor source document${
                selectedDocumentIds.length === 1
                  ? ""
                  : "s"
              } selected for planning context.`
            : planSpecificFiles.length > 0
              ? `${planSpecificFiles.length} plan-specific supporting file${
                  planSpecificFiles.length === 1
                    ? ""
                    : "s"
                } staged for this plan; no contractor source documents are selected.`
              : "No source documents are selected. The plan may continue using user-entered information, but document intelligence will be limited.",
        status:
          selectedDocumentIds.length > 0
            ? "Pass"
            : "Warning",
      });

      return checks;
    }, [
      activeWorkSteps,
      emergencyPlan,
      highRiskSteps,
      planSpecificFiles.length,
      planningProgress.criticalUnresolved,
      requiredPermits,
      requiredPpe,
      requirementsData,
      responsibleSupervisor,
      scopeDescription,
      scopeTitle,
      selectedContractor,
      selectedDocumentIds.length,
      selectedProject,
      confirmedHighRiskActivities.length,
      stopWorkTriggers,
      workStepPlanning,
    ]);

  const planningQualitySummary =
    useMemo(() => {
      const actionRequired =
        planningQualityChecks.filter(
          (check) =>
            check.status ===
            "Action Required",
        ).length;

      const warnings =
        planningQualityChecks.filter(
          (check) =>
            check.status === "Warning",
        ).length;

      const passed =
        planningQualityChecks.filter(
          (check) =>
            check.status === "Pass",
        ).length;

      const score = Math.max(
        0,
        Math.min(
          100,
          100 -
            actionRequired * 15 -
            warnings * 6,
        ),
      );

      return {
        actionRequired,
        warnings,
        passed,
        score,
      };
    }, [planningQualityChecks]);


  const reviewConfirmationProgress =
    useMemo(() => {
      const entries = Object.values(
        reviewConfirmations,
      );

      const confirmed =
        entries.filter(Boolean).length;

      return {
        confirmed,
        total: entries.length,
        percent: Math.round(
          (confirmed / entries.length) * 100,
        ),
      };
    }, [reviewConfirmations]);


  const reviewCommentSummary =
    useMemo(() => {
      const open = reviewComments.filter(
        (comment) =>
          comment.status === "Open",
      ).length;

      const resolved = reviewComments.filter(
        (comment) =>
          comment.status === "Resolved",
      ).length;

      return {
        open,
        resolved,
        total: reviewComments.length,
      };
    }, [reviewComments]);


  const submissionSignatureSummary =
    useMemo(() => {
      const required =
        submissionSignatures.filter(
          (signature) =>
            signature.required,
        );

      const requiredSigned =
        required.filter(
          (signature) =>
            signature.status === "Signed",
        ).length;

      const signed =
        submissionSignatures.filter(
          (signature) =>
            signature.status === "Signed",
        ).length;

      return {
        required: required.length,
        requiredSigned,
        pendingRequired:
          required.length - requiredSigned,
        total: submissionSignatures.length,
        signed,
      };
    }, [submissionSignatures]);

  function continueFromPlanType() {
    if (
      !selectedPlanType
    ) {
      setStepError(
        "Select a plan type before continuing.",
      );

      return;
    }

    setStepError("");
    setCurrentStep(2);
  }

  function handleProjectChange(
    projectId: string,
  ) {
    setSelectedProjectId(
      projectId,
    );

    setSelectedContractorId(
      "",
    );

    setRequirementsData(null);
    setSelectedDocumentIds([]);
    setPlanSpecificFiles([]);
    setStepError("");
  }

  async function continueFromAssignment() {
    if (!selectedPlanType) {
      setStepError(
        "Select a plan type before continuing.",
      );
      return;
    }

    if (!selectedProjectId) {
      setStepError(
        "Select the project where the work will occur.",
      );
      return;
    }

    if (!selectedContractorId) {
      setStepError(
        "Select the contractor performing the work.",
      );
      return;
    }

    if (!responsibleSupervisor.trim()) {
      setStepError(
        "Enter the responsible supervisor or foreman.",
      );
      return;
    }

    if (!selectedProject) {
      setStepError(
        "The selected project could not be loaded.",
      );
      return;
    }

    if (!selectedContractor) {
      setStepError(
        "The selected contractor could not be loaded.",
      );
      return;
    }

    setStepError("");
    setRequirementsError("");
    setRequirementsLoading(true);
    setPlanningDraftSaving(true);

    try {
      const draftPayload = {
        tenantId: selectedProject.tenantId,
        companyId: selectedProject.companyId,
        projectId: selectedProject.id,
        contractorId: selectedContractor.id,
        planType: selectedPlanType,

        title:
          scopeTitle.trim() ||
          `${selectedPlanType} Draft - ${selectedProject.name}`,

        responsibleSupervisor:
          responsibleSupervisor.trim(),

        plannedStartDate:
          plannedStartDate || null,

        workLocation:
          workLocation.trim() || null,

        crewSize:
          crewSize || null,

        shift:
          shift || null,

        status: "Draft",
      };

      let activePlanningRecordId =
        planningRecordId;

      if (!activePlanningRecordId) {
        const createResponse =
          await fetch("/api/planning", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              draftPayload,
            ),
          });

        const createData =
          (await createResponse.json()) as {
            record?: {
              id: string;
            };
            message?: string;
          };

        if (!createResponse.ok) {
          throw new Error(
            createData.message ||
              "Unable to create the planning draft.",
          );
        }

        if (!createData.record?.id) {
          throw new Error(
            "Planning draft was created without a record ID.",
          );
        }

        activePlanningRecordId =
          createData.record.id;

        setPlanningRecordId(
          activePlanningRecordId,
        );
      } else {
        const updateResponse =
          await fetch(
            `/api/planning/${activePlanningRecordId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                draftPayload,
              ),
            },
          );

        const updateData =
          (await updateResponse.json()) as {
            record?: {
              id: string;
            };
            message?: string;
          };

        if (!updateResponse.ok) {
          throw new Error(
            updateData.message ||
              "Unable to update the planning draft.",
          );
        }
      }

      const params =
        new URLSearchParams({
          projectId:
            selectedProjectId,
          contractorId:
            selectedContractorId,
        });

      const response =
        await fetch(
          `/api/planning/requirements?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as
          | PlanningRequirementsResponse
          | {
              message?: string;
            };

      if (!response.ok) {
        throw new Error(
          "message" in data
            ? data.message ||
                "Unable to load requirements and documents."
            : "Unable to load requirements and documents.",
        );
      }

      if (
        "requirements" in data &&
        "documents" in data
      ) {
        setRequirementsData(data);

        setSelectedDocumentIds(
          data.documents
            .filter(
              (document) =>
                document.planningStatus
                  .recommendedForAi,
            )
            .map(
              (document) =>
                document.id,
            ),
        );

        setCurrentStep(3);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save the planning draft.";

      setRequirementsError(
        message,
      );

      setStepError(
        message,
      );
    } finally {
      setRequirementsLoading(false);
      setPlanningDraftSaving(false);
    }
  }

  function togglePlanningDocument(
    document: PlanningDocument,
  ) {
    if (
      document.planningStatus.isExpired ||
      document.approvalStatus.toLowerCase() === "rejected"
    ) {
      return;
    }

    setSelectedDocumentIds((current) =>
      current.includes(document.id)
        ? current.filter((id) => id !== document.id)
        : [...current, document.id],
    );
  }

  function continueFromRequirements() {
    setStepError("");
    setCurrentStep(4);
  }

  function addWorkSequenceStep() {
    setWorkSequence((current) => [
      ...current,
      {
        id: `step-${Date.now()}`,
        title: "",
        description: "",
      },
    ]);
  }

  function updateWorkSequenceStep(
    id: string,
    field: "title" | "description",
    value: string,
  ) {
    setWorkSequence((current) =>
      current.map((step) =>
        step.id === id
          ? {
              ...step,
              [field]: value,
            }
          : step,
      ),
    );
  }

  function removeWorkSequenceStep(
    id: string,
  ) {
    setWorkSequence((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (step) => step.id !== id,
      );
    });
  }

  function toggleSafetyCriticalCategory(
    category: string,
  ) {
    setSelectedSafetyCriticalCategories((current) =>
      current.includes(category)
        ? current.filter(
            (item) => item !== category,
          )
        : [...current, category],
    );
  }

  async function continueFromScope() {
    if (!scopeTitle.trim()) {
      setStepError(
        "Enter the work activity or task title.",
      );
      return;
    }

    if (!scopeDescription.trim()) {
      setStepError(
        "Describe the scope of work before continuing.",
      );
      return;
    }

    if (!workLocation.trim()) {
      setStepError(
        "Enter the work location or area before continuing.",
      );
      return;
    }

    if (!crewSize.trim()) {
      setStepError(
        "Enter the expected crew size before continuing.",
      );
      return;
    }

    if (!equipmentTools.trim()) {
      setStepError(
        "Enter the equipment and tools the crew expects to use.",
      );
      return;
    }

    const completedSequence = workSequence.filter(
      (step) =>
        step.title.trim() ||
        step.description.trim(),
    );

    if (completedSequence.length === 0) {
      setStepError(
        "Add at least one major work step or activity.",
      );
      return;
    }

    if (
      completedSequence.some(
        (step) => !step.title.trim(),
      )
    ) {
      setStepError(
        "Give each entered work step a short title.",
      );
      return;
    }

    const normalizedCrewSize =
      crewSize.trim();

    if (normalizedCrewSize) {
      const parsedCrewSize =
        Number(normalizedCrewSize);

      if (
        !Number.isInteger(
          parsedCrewSize,
        ) ||
        parsedCrewSize < 1
      ) {
        setStepError(
          "Expected crew size must be a whole number of 1 or greater.",
        );
        return;
      }
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before continuing.",
      );
      return;
    }

    if (!selectedProject) {
      setStepError(
        "The selected project is not available. Return to Assignment and reload the project before continuing.",
      );
      return;
    }

    setStepError("");
    setPlanningDraftSaving(true);
    setActivityDetectionLoading(true);
    setActivityDetectionError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title:
                scopeTitle.trim(),
              scopeDescription:
                scopeDescription.trim(),
              plannedStartDate:
                plannedStartDate || null,
              workLocation:
                workLocation.trim() || null,
              crewSize:
                crewSize || null,
              shift:
                shift || null,
              equipmentTools:
                equipmentTools.trim() || null,
              materialsChemicals:
                materialsChemicals.trim() || null,
              adjacentWork:
                adjacentWork.trim() || null,
              specialConditions:
                specialConditions.trim() || null,
              status: "Draft",
            }),
          },
        );

      const data =
        (await response.json()) as {
          record?: {
            id: string;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save the work scope.",
        );
      }

      if (!data.record?.id) {
        throw new Error(
          "The work scope was not confirmed as saved.",
        );
      }

      const activityScopeText = [
        scopeTitle.trim(),
        scopeDescription.trim(),
        equipmentTools.trim(),
        materialsChemicals.trim(),
        adjacentWork.trim(),
        specialConditions.trim(),
        ...completedSequence.flatMap((step) => [
          step.title.trim(),
          step.description.trim(),
        ]),
      ]
        .filter(Boolean)
        .join(". ");

      const activityResponse = await fetch(
        "/api/planning/activity-detection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenantId: selectedProject.tenantId,
            scopeText: activityScopeText,
          }),
        },
      );

      const activityData =
        (await activityResponse.json()) as {
          activities?: DetectedPlanningActivity[];
          message?: string;
        };

      if (!activityResponse.ok) {
        throw new Error(
          activityData.message ||
            "Unable to analyze the work scope for applicable activities.",
        );
      }

      const nextDetectedActivities =
        activityData.activities ?? [];

      setDetectedActivities(
        nextDetectedActivities,
      );
      setConfirmedActivityCodes(
        nextDetectedActivities.map(
          (activity) => activity.activityCode,
        ),
      );

      setPlanningAnswers((current) => ({
        ...current,
        CORE_SCOPE_DESCRIPTION: {
          value: scopeDescription.trim(),
          notes:
            current.CORE_SCOPE_DESCRIPTION?.notes ?? "",
        },
        CORE_WORK_LOCATION: {
          value: workLocation.trim(),
          notes:
            current.CORE_WORK_LOCATION?.notes ?? "",
        },
        CORE_CREW_SIZE: {
          value: crewSize.trim(),
          notes:
            current.CORE_CREW_SIZE?.notes ?? "",
        },
        CORE_EQUIPMENT_TOOLS: {
          value: equipmentTools.trim(),
          notes:
            current.CORE_EQUIPMENT_TOOLS?.notes ?? "",
        },
        CORE_MATERIALS: {
          value: materialsChemicals.trim(),
          notes:
            current.CORE_MATERIALS?.notes ?? "",
        },
      }));

      const initialStepPlanning: Record<
        string,
        WorkStepPlanning
      > = {};

      workSequence.forEach((step) => {
        if (
          step.title.trim() ||
          step.description.trim()
        ) {
          initialStepPlanning[step.id] =
            workStepPlanning[step.id] ?? {
              hazards: "",
              controls: "",
              safetyCritical: false,
              riskLevel: "",
            };
        }
      });

      setWorkStepPlanning(
        initialStepPlanning,
      );
      setCurrentStep(5);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save and analyze the work scope.";

      setActivityDetectionError(message);
      setStepError(message);
    } finally {
      setPlanningDraftSaving(false);
      setActivityDetectionLoading(false);
    }
  }

  function updatePlanningAnswer(
    questionCode: string,
    field: "value" | "notes",
    value: string,
  ) {
    setPlanningAnswers((current) => ({
      ...current,
      [questionCode]: {
        value:
          field === "value"
            ? value
            : current[questionCode]?.value ?? "",
        notes:
          field === "notes"
            ? value
            : current[questionCode]?.notes ?? "",
      },
    }));

    setStepError("");
  }

  function toggleConfirmedActivity(
    activityCode: string,
  ) {
    setConfirmedActivityCodes((current) =>
      current.includes(activityCode)
        ? current.filter(
            (code) => code !== activityCode,
          )
        : [...current, activityCode],
    );

    setStepError("");
  }

  function updateWorkStepPlanning(
    stepId: string,
    field: keyof WorkStepPlanning,
    value: string | boolean,
  ) {
    setWorkStepPlanning((current) => ({
      ...current,
      [stepId]: {
        hazards: current[stepId]?.hazards ?? "",
        controls: current[stepId]?.controls ?? "",
        safetyCritical:
          current[stepId]?.safetyCritical ?? false,
        riskLevel:
          current[stepId]?.riskLevel ?? "",
        [field]: value,
      },
    }));

    setStepError("");
  }

  async function continueFromGuidedPlanning() {
    const unansweredCritical =
      guidedPlanningQuestions.filter(
        (question) =>
          question.isCritical &&
          !planningAnswers[
            question.questionCode
          ]?.value.trim(),
      );

    if (unansweredCritical.length > 0) {
      setStepError(
        `Answer all safety-critical planning questions before continuing. ${unansweredCritical.length} critical item${
          unansweredCritical.length === 1 ? "" : "s"
        } remain.`,
      );
      return;
    }

    const activeSteps = workSequence.filter(
      (step) =>
        step.title.trim() ||
        step.description.trim(),
    );

    const incompleteSteps = activeSteps.filter(
      (step) => {
        const planning = workStepPlanning[step.id];

        return (
          !planning?.hazards.trim() ||
          !planning?.controls.trim()
        );
      },
    );

    if (incompleteSteps.length > 0) {
      setStepError(
        "Identify hazards and controls for every work step before continuing.",
      );
      return;
    }

    const unratedSteps = activeSteps.filter(
      (step) =>
        !workStepPlanning[step.id]?.riskLevel,
    );

    if (unratedSteps.length > 0) {
      setStepError(
        `Select a Low, Medium, or High risk level for every work step before continuing. ${unratedSteps.length} step${
          unratedSteps.length === 1 ? "" : "s"
        } still need a risk rating.`,
      );
      return;
    }

    if (!emergencyPlan.trim()) {
      setStepError(
        "Document the task-specific emergency plan before continuing.",
      );
      return;
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before continuing.",
      );
      return;
    }

    setStepError("");
    setPlanningDraftSaving(true);

    try {
      const workStepsPayload =
        activeSteps.map((step, index) => {
          const planning =
            workStepPlanning[step.id];

          return {
            sequence: index + 1,
            title: step.title.trim(),
            description:
              step.description.trim() || null,
            hazards:
              planning?.hazards.trim() || null,
            controls:
              planning?.controls.trim() || null,
            safetyCritical:
              Boolean(planning?.safetyCritical),
            riskLevel:
              planning?.riskLevel || null,
          };
        });

      const questionResponsesPayload =
        guidedPlanningQuestions.map(
          (question) => {
            const answer =
              planningAnswers[
                question.questionCode
              ] ?? {
                value: "",
                notes: "",
              };

            return {
              questionId:
                question.questionCode,
              category: question.category,
              question:
                question.questionText,
              helpText: question.helpText,
              isCritical:
                question.isCritical,
              responseValue:
                answer.value || null,
              notes:
                answer.notes.trim() || null,
            };
          },
        );

      const response =
        await fetch(
          `/api/planning/${planningRecordId}/guided-planning`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              confirmedActivities:
                detectedActivities
                  .filter((activity) =>
                    confirmedActivityCodes.includes(
                      activity.activityCode,
                    ),
                  )
                  .map((activity) => ({
                    activityCode:
                      activity.activityCode,
                    name:
                      activity.name,
                    category:
                      activity.category,
                    detectionSource:
                      "System",
                    score:
                      activity.score,
                  })),

              confirmedBy:
                responsibleSupervisor.trim() ||
                null,

              workSteps:
                workStepsPayload,
              questionResponses:
                questionResponsesPayload,
              requiredPpe:
                requiredPpe.trim() || null,
              requiredPermits:
                requiredPermits.trim() || null,
              emergencyPlan:
                emergencyPlan.trim() || null,
              stopWorkTriggers:
                stopWorkTriggers.trim() || null,
              planningNotes:
                planningNotes.trim() || null,
              qualityScore:
                planningQualitySummary.score,
            }),
          },
        );

      const data =
        (await response.json()) as {
          record?: {
            id: string;
          };
          saved?: {
            workSteps: number;
            questionResponses: number;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save guided planning.",
        );
      }

      if (!data.record?.id) {
        throw new Error(
          "Guided planning was not confirmed as saved.",
        );
      }

      setDraftGenerated(false);
    setGeneratedPlanningDraft(null);
      setCurrentStep(6);
    } catch (error) {
      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to save guided planning.",
      );
    } finally {
      setPlanningDraftSaving(false);
    }
  }

  async function generateDraftPlan() {
    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before building the plan.",
      );
      return;
    }

    setStepError("");
    setDraftBuildSaving(true);

    try {
      const generationResponse =
        await fetch(
          `/api/planning/${planningRecordId}/draft-generation`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );

      const generationData =
        (await generationResponse.json()) as {
          planningRecordId?: string;
          draft?: GeneratedPlanningDraft;
          message?: string;
        };

      if (!generationResponse.ok) {
        throw new Error(
          generationData.message ||
            "Unable to generate the planning draft.",
        );
      }

      if (!generationData.draft) {
        throw new Error(
          "Qoreva did not return a generated planning draft.",
        );
      }

      const generatedDraft =
        generationData.draft;

      setGeneratedPlanningDraft(
        generatedDraft,
      );

      const nextWorkStepPlanning: Record<
        string,
        WorkStepPlanning
      > = {
        ...workStepPlanning,
      };

      activeWorkSteps.forEach(
        (step, index) => {
          const generatedStep =
            generatedDraft.workSteps.find(
              (generated) =>
                generated.sequence === index + 1 ||
                generated.title
                  .trim()
                  .toLowerCase() ===
                  step.title
                    .trim()
                    .toLowerCase(),
            );

          const currentPlanning =
            nextWorkStepPlanning[
              step.id
            ] ?? {
              hazards: "",
              controls: "",
              safetyCritical: false,
              riskLevel: "",
            };

          if (!generatedStep) {
            nextWorkStepPlanning[
              step.id
            ] = currentPlanning;
            return;
          }

          const generatedHazards =
            Array.from(
              new Set(
                generatedStep
                  .suggestedHazards
                  .map((hazard) =>
                    hazard.trim(),
                  )
                  .filter(Boolean),
              ),
            );

          const generatedControls =
            Array.from(
              new Set(
                generatedStep
                  .suggestedControls
                  .map((control) =>
                    control.trim(),
                  )
                  .filter(Boolean),
              ),
            );

          nextWorkStepPlanning[
            step.id
          ] = {
            hazards:
              currentPlanning.hazards.trim()
                ? currentPlanning.hazards
                : generatedHazards.join(
                    "\n",
                  ),

            controls:
              currentPlanning.controls.trim()
                ? currentPlanning.controls
                : generatedControls.join(
                    "\n",
                  ),

            safetyCritical:
              currentPlanning.safetyCritical ||
              generatedStep.safetyCriticalSuggested,

            riskLevel:
              currentPlanning.riskLevel,
          };
        },
      );

      setWorkStepPlanning(
        nextWorkStepPlanning,
      );

      function mergeGeneratedText(
        existingValue: string,
        suggestions:
          GeneratedDraftControlSuggestion[],
      ) {
        if (existingValue.trim()) {
          return existingValue;
        }

        return Array.from(
          new Set(
            suggestions
              .map(
                (suggestion) =>
                  suggestion.text.trim(),
              )
              .filter(Boolean),
          ),
        ).join("\n");
      }

      const nextRequiredPpe =
        mergeGeneratedText(
          requiredPpe,
          generatedDraft.ppeSuggestions,
        );

      const nextRequiredPermits =
        mergeGeneratedText(
          requiredPermits,
          generatedDraft.permitSuggestions,
        );

      const nextEmergencyPlan =
        mergeGeneratedText(
          emergencyPlan,
          generatedDraft.emergencySuggestions,
        );

      const nextStopWorkTriggers =
        mergeGeneratedText(
          stopWorkTriggers,
          generatedDraft.stopWorkSuggestions,
        );

      setRequiredPpe(
        nextRequiredPpe,
      );

      setRequiredPermits(
        nextRequiredPermits,
      );

      setEmergencyPlan(
        nextEmergencyPlan,
      );

      setStopWorkTriggers(
        nextStopWorkTriggers,
      );

      const snapshot = {
        version: 2,
        capturedAt:
          new Date().toISOString(),

        assignment: {
          planType:
            selectedPlanType,

          projectId:
            selectedProject?.id ??
            null,

          projectName:
            selectedProject?.name ??
            null,

          projectCode:
            selectedProject?.projectCode ??
            null,

          contractorId:
            selectedContractor?.id ??
            null,

          contractorName:
            selectedContractor?.name ??
            null,

          responsibleSupervisor:
            responsibleSupervisor.trim() ||
            null,

          plannedStartDate:
            plannedStartDate ||
            null,

          workLocation:
            workLocation.trim() ||
            null,

          crewSize:
            crewSize ||
            null,

          shift:
            shift ||
            null,
        },

        scope: {
          title:
            scopeTitle.trim() ||
            null,

          description:
            scopeDescription.trim() ||
            null,

          equipmentTools:
            equipmentTools.trim() ||
            null,

          materialsChemicals:
            materialsChemicals.trim() ||
            null,

          adjacentWork:
            adjacentWork.trim() ||
            null,

          specialConditions:
            specialConditions.trim() ||
            null,

          safetyCriticalCategories:
            selectedSafetyCriticalCategories,

          confirmedActivityCodes,

          detectedActivities:
            detectedActivities.map(
              (activity) => ({
                activityCode:
                  activity.activityCode,

                name:
                  activity.name,

                category:
                  activity.category,

                isHighRisk:
                  activity.isHighRisk,

                score:
                  activity.score,
              }),
            ),
        },

        workSteps:
          activeWorkSteps.map(
            (step, index) => {
              const planning =
                nextWorkStepPlanning[
                  step.id
                ];

              const generatedStep =
                generatedDraft.workSteps.find(
                  (generated) =>
                    generated.sequence ===
                      index + 1 ||
                    generated.title
                      .trim()
                      .toLowerCase() ===
                      step.title
                        .trim()
                        .toLowerCase(),
                );

              return {
                sequence:
                  index + 1,

                sourceId:
                  step.id,

                title:
                  step.title,

                description:
                  step.description ||
                  null,

                hazards:
                  planning?.hazards ||
                  null,

                controls:
                  planning?.controls ||
                  null,

                safetyCritical:
                  Boolean(
                    planning?.safetyCritical,
                  ),

                riskLevel:
                  planning?.riskLevel ||
                  null,

                qorevaGeneration: {
                  riskAttention:
                    generatedStep?.riskAttention ??
                    "Normal",

                  source:
                    generatedStep?.source ??
                    null,

                  sourceActivityCodes:
                    generatedStep
                      ?.sourceActivityCodes ??
                    [],

                  sourceQuestionCodes:
                    generatedStep
                      ?.sourceQuestionCodes ??
                    [],

                  sourceRequirementIds:
                    generatedStep
                      ?.sourceRequirementIds ??
                    [],
                },
              };
            },
          ),

        guidedPlanning: {
          questions:
            guidedPlanningQuestions.map(
              (question) => {
                const answer =
                  planningAnswers[
                    question.questionCode
                  ] ?? {
                    value: "",
                    notes: "",
                  };

                return {
                  questionId:
                    question.questionCode,

                  definitionId:
                    question.id,

                  category:
                    question.category,

                  section:
                    question.section,

                  question:
                    question.questionText,

                  helpText:
                    question.helpText,

                  questionType:
                    question.questionType,

                  critical:
                    question.isCritical,

                  response:
                    answer.value ||
                    null,

                  notes:
                    answer.notes ||
                    null,
                };
              },
            ),

          requiredPpe:
            nextRequiredPpe.trim() ||
            null,

          requiredPermits:
            nextRequiredPermits.trim() ||
            null,

          emergencyPlan:
            nextEmergencyPlan.trim() ||
            null,

          stopWorkTriggers:
            nextStopWorkTriggers.trim() ||
            null,

          planningNotes:
            planningNotes.trim() ||
            null,
        },

        qorevaDraftGeneration: {
          generatedAt:
            generatedDraft.generatedAt,

          generatorVersion:
            generatedDraft.metadata
              .generatorVersion,

          metadata:
            generatedDraft.metadata,

          reviewFlags:
            generatedDraft.reviewFlags,

          workSteps:
            generatedDraft.workSteps,

          ppeSuggestions:
            generatedDraft.ppeSuggestions,

          permitSuggestions:
            generatedDraft.permitSuggestions,

          emergencySuggestions:
            generatedDraft.emergencySuggestions,

          stopWorkSuggestions:
            generatedDraft.stopWorkSuggestions,

          requirementControlSuggestions:
            generatedDraft.requirementControlSuggestions,
        },

        sourceContext: {
          selectedContractorDocumentIds:
            selectedDocumentIds,

          planSpecificFiles:
            planSpecificFiles.map(
              (file) => ({
                name:
                  file.name,

                type:
                  file.type,

                size:
                  file.size,

                lastModified:
                  file.lastModified,
              }),
            ),

          requirementsSummary:
            requirementsData?.summary ??
            null,
        },

        quality: {
          score:
            planningQualitySummary.score,

          actionRequired:
            planningQualitySummary.actionRequired,

          warnings:
            planningQualitySummary.warnings,

          passed:
            planningQualitySummary.passed,

          checks:
            planningQualityChecks,
        },
      };

      const response =
        await fetch(
          `/api/planning/${planningRecordId}/revision`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              revisionNumber:
                planningRevisionNumber,

              status:
                "Draft",

              revisionReason:
                draftGenerated
                  ? "Qoreva-assisted draft refreshed before qualified review."
                  : "Initial Qoreva-assisted draft generated for qualified review.",

              snapshot,
            }),
          },
        );

      const data =
        (await response.json()) as {
          revision?: {
            id: string;
            revisionNumber: number;
          };

          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to persist the draft planning revision.",
        );
      }

      if (!data.revision?.id) {
        throw new Error(
          "The draft revision was not confirmed as saved.",
        );
      }

      setPlanningRevisionNumber(
        data.revision.revisionNumber,
      );

      setDraftGenerated(true);
    } catch (error) {
      setDraftGenerated(false);

      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to generate and persist the planning draft.",
      );
    } finally {
      setDraftBuildSaving(false);
    }
  }

  function continueFromBuildPlan() {
    if (!draftGenerated) {
      setStepError(
        "Generate and save the draft plan before continuing to qualified review.",
      );
      return;
    }

    setStepError("");
    setCurrentStep(7);
  }

  function toggleReviewConfirmation(
    key: ReviewConfirmationKey,
  ) {
    setReviewConfirmations((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setStepError("");
  }

  function returnToStep(
    step: number,
  ) {
    setStepError("");
    setCurrentStep(step);
  }

  function openReviewComment(
    targetId: string,
  ) {
    setActiveReviewTargetId(targetId);
    setReviewCommentDraft("");
    setStepError("");
  }

  function cancelReviewComment() {
    setActiveReviewTargetId(null);
    setReviewCommentDraft("");
  }

  function addReviewComment({
    targetId,
    section,
    label,
  }: {
    targetId: string;
    section: string;
    label: string;
  }) {
    const comment =
      reviewCommentDraft.trim();

    if (!comment) {
      setStepError(
        "Enter a revision comment explaining what needs to be corrected.",
      );
      return;
    }

    setReviewComments((current) => [
      ...current,
      {
        id: `review-comment-${Date.now()}`,
        targetId,
        section,
        label,
        comment,
        status: "Open",
        createdBy:
          reviewerName.trim() ||
          "Qualified Reviewer",
        createdAt:
          new Date().toISOString(),
        resolvedAt: null,
      },
    ]);

    setActiveReviewTargetId(null);
    setReviewCommentDraft("");
    setStepError("");
  }

  function resolveReviewComment(
    commentId: string,
  ) {
    setReviewComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              status: "Resolved",
              resolvedAt:
                new Date().toISOString(),
            }
          : comment,
      ),
    );

    setStepError("");
  }

  function reopenReviewComment(
    commentId: string,
  ) {
    setReviewComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              status: "Open",
              resolvedAt: null,
            }
          : comment,
      ),
    );

    setStepError("");
  }

  function jumpToReviewTarget(
    targetId: string,
  ) {
    const element =
      document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      element.classList.add(
        "ring-4",
        "ring-[rgba(102,87,232,0.16)]",
      );

      window.setTimeout(() => {
        element.classList.remove(
          "ring-4",
          "ring-[rgba(102,87,232,0.16)]",
        );
      }, 1800);
    }
  }

  async function continueFromQualifiedReview() {
    if (!reviewerName.trim()) {
      setStepError(
        "Enter the qualified reviewer's name before continuing.",
      );
      return;
    }

    if (!reviewerRole.trim()) {
      setStepError(
        "Enter the qualified reviewer's role or title before continuing.",
      );
      return;
    }

    const incompleteConfirmations =
      Object.entries(reviewConfirmations).filter(
        ([, confirmed]) => !confirmed,
      );

    if (incompleteConfirmations.length > 0) {
      setStepError(
        `Complete all qualified-review confirmations before continuing. ${incompleteConfirmations.length} item${
          incompleteConfirmations.length === 1
            ? ""
            : "s"
        } remain.`,
      );
      return;
    }

    if (
      planningQualitySummary.actionRequired > 0
    ) {
      setStepError(
        "Resolve all Action Required planning quality items before continuing to submission.",
      );
      return;
    }

    if (reviewCommentSummary.open > 0) {
      setStepError(
        `Resolve all open review comments before continuing to submission. ${reviewCommentSummary.open} open comment${
          reviewCommentSummary.open === 1 ? "" : "s"
        } remain.`,
      );
      return;
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before completing qualified review.",
      );
      return;
    }

    if (!draftGenerated) {
      setStepError(
        "Generate and save the current draft revision before completing qualified review.",
      );
      return;
    }

    setStepError("");
    setQualifiedReviewSaving(true);

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/review`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              revisionNumber:
                planningRevisionNumber,
              reviewerName:
                reviewerName.trim(),
              reviewerRole:
                reviewerRole.trim(),
              reviewNotes:
                reviewNotes.trim() || null,
              confirmations:
                reviewConfirmations,
              comments:
                reviewComments.map(
                  (comment) => ({
                    clientId:
                      comment.id,
                    targetId:
                      comment.targetId,
                    section:
                      comment.section,
                    label:
                      comment.label,
                    comment:
                      comment.comment,
                    status:
                      comment.status,
                    createdByName:
                      comment.createdBy,
                    createdAt:
                      comment.createdAt,
                    resolvedAt:
                      comment.resolvedAt,
                  }),
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          review?: {
            id: string;
            status: string;
            completedAt:
              | string
              | null;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to persist the qualified review.",
        );
      }

      if (!data.review?.id) {
        throw new Error(
          "The qualified review was not confirmed as saved.",
        );
      }

      const defaultSignatures: SubmissionSignature[] = [
        {
          id: "responsible-supervisor",
          role: "Responsible Supervisor / Foreman",
          signerName:
            responsibleSupervisor.trim(),
          required: true,
          status: "Pending",
          signedAt: null,
          signatureDataUrl: null,
        },
        {
          id: "qualified-reviewer",
          role:
            reviewerRole.trim() ||
            "Qualified Reviewer",
          signerName:
            reviewerName.trim(),
          required: true,
          status: "Pending",
          signedAt: null,
          signatureDataUrl: null,
        },
      ];

      setSubmissionSignatures(
        (current) =>
          current.length > 0
            ? current
            : defaultSignatures,
      );

      setSubmitted(false);
      setSubmittedAt(null);
      setSubmissionAcknowledged(false);
      setCurrentStep(8);
    } catch (error) {
      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to persist the qualified review.",
      );
    } finally {
      setQualifiedReviewSaving(false);
    }
  }

  function signSubmissionRole(
    signatureId: string,
    signatureDataUrl: string,
  ) {
    setSubmissionSignatures((current) =>
      current.map((signature) =>
        signature.id === signatureId
          ? {
              ...signature,
              status: "Signed",
              signedAt:
                new Date().toISOString(),
              signatureDataUrl,
            }
          : signature,
      ),
    );

    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  function clearSubmissionSignature(
    signatureId: string,
  ) {
    setSubmissionSignatures((current) =>
      current.map((signature) =>
        signature.id === signatureId
          ? {
              ...signature,
              status: "Pending",
              signedAt: null,
              signatureDataUrl: null,
            }
          : signature,
      ),
    );

    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  function addAdditionalApprover() {
    if (!additionalApproverRole.trim()) {
      setStepError(
        "Enter the additional approver role.",
      );
      return;
    }

    if (!additionalApproverName.trim()) {
      setStepError(
        "Enter the additional approver name.",
      );
      return;
    }

    setSubmissionSignatures((current) => [
      ...current,
      {
        id: `additional-${Date.now()}`,
        role:
          additionalApproverRole.trim(),
        signerName:
          additionalApproverName.trim(),
        required: false,
        status: "Pending",
        signedAt: null,
        signatureDataUrl: null,
      },
    ]);

    setAdditionalApproverRole("");
    setAdditionalApproverName("");
    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  function removeAdditionalApprover(
    signatureId: string,
  ) {
    setSubmissionSignatures((current) =>
      current.filter(
        (signature) =>
          signature.id !== signatureId,
      ),
    );

    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  async function submitPlanningRecord() {
    if (
      submissionSignatureSummary
        .pendingRequired > 0
    ) {
      setStepError(
        `Complete all required signatures before submission. ${submissionSignatureSummary.pendingRequired} required signature${
          submissionSignatureSummary
            .pendingRequired === 1
            ? ""
            : "s"
        } remain.`,
      );
      return;
    }

    if (reviewCommentSummary.open > 0) {
      setStepError(
        "Resolve all open revision comments before submitting the planning record.",
      );
      return;
    }

    if (!submissionAcknowledged) {
      setStepError(
        "Confirm the final submission acknowledgement before submitting the planning record.",
      );
      return;
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before submission.",
      );
      return;
    }

    const missingCapturedSignature =
      submissionSignatures.find(
        (signature) =>
          signature.status === "Signed" &&
          !signature.signatureDataUrl,
      );

    if (missingCapturedSignature) {
      setStepError(
        `${missingCapturedSignature.role} is marked signed but no captured signature image is available.`,
      );
      return;
    }

    setStepError("");
    setSubmissionSaving(true);

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              revisionNumber:
                planningRevisionNumber,
              acknowledged:
                submissionAcknowledged,
              signatures:
                submissionSignatures.map(
                  (
                    signature,
                    index,
                  ) => ({
                    role:
                      signature.role,
                    signerName:
                      signature.signerName,
                    isRequired:
                      signature.required,
                    sortOrder:
                      index,
                    status:
                      signature.status,
                    signatureType:
                      "Drawn",
                    signatureDataUrl:
                      signature.signatureDataUrl,
                    signedAt:
                      signature.signedAt,
                  }),
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          record?: {
            id: string;
            status: string;
            submittedAt:
              | string
              | null;
          };
          saved?: {
            signatures: number;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit the planning record.",
        );
      }

      if (
        !data.record?.id ||
        data.record.status !==
          "Submitted"
      ) {
        throw new Error(
          "The planning record was not confirmed as submitted.",
        );
      }

      setSubmitted(true);
      setSubmittedAt(
        data.record.submittedAt ??
          new Date().toISOString(),
      );
    } catch (error) {
      setSubmitted(false);
      setSubmittedAt(null);
      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to submit the planning record.",
      );
    } finally {
      setSubmissionSaving(false);
    }
  }

  function goBackOneStep() {
    setStepError("");

    if (currentStep > 1) {
      setCurrentStep(
        (current) =>
          current - 1,
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="
          relative
          overflow-hidden
          rounded-[1.75rem]
          border
          border-[var(--qoreva-border)]
          bg-white
          p-5
          shadow-[var(--qoreva-shadow-sm)]
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-[rgba(102,87,232,0.08)]
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/planning"
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[var(--qoreva-violet)]
                  transition
                  hover:text-[var(--qoreva-violet-dark)]
                "
              >
                Qoreva™ Planning
              </Link>

              <span className="text-[var(--qoreva-subtle)]">
                /
              </span>

              <span
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[var(--qoreva-muted)]
                "
              >
                {editPlanningRecordId
                  ? "Edit Revision"
                  : "Create Plan"}
              </span>
            </div>

            <h1
              className="
                mt-2
                text-3xl
                font-black
                tracking-[-0.045em]
                text-[var(--qoreva-obsidian)]
                sm:text-4xl
              "
            >
              {editPlanningRecordId
                ? `Edit Planning Revision ${planningRevisionNumber}`
                : "Create a Planning Record"}
            </h1>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                font-medium
                leading-6
                text-[var(--qoreva-muted)]
              "
            >
              {editPlanningRecordId
                ? "Update the existing working revision without overwriting earlier submitted revision history. Regenerate the draft, complete qualified review, capture new signatures, and resubmit this revision."
                : "Qoreva guides the planning process from work setup through requirements, hazards, controls, qualified review, and field readiness."}
            </p>
          </div>

          <Link
            href="/planning"
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--qoreva-border-strong)]
              bg-white
              px-4
              py-2.5
              text-sm
              font-black
              text-[var(--qoreva-text)]
              transition
              hover:bg-[var(--qoreva-surface-muted)]
            "
          >
            ← Back to Planning
          </Link>
        </div>
      </section>

      {editPlanningRecordId ? (
        <section
          className={`
            rounded-[1.75rem]
            border
            p-5
            shadow-[var(--qoreva-shadow-sm)]
            sm:p-6
            ${
              editModeError
                ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
                : "border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-faint)]"
            }
          `}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                Revision Editing Mode
              </p>

              <h2 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                {editModeLoading
                  ? "Loading existing revision..."
                  : editModeError
                    ? "Unable to load revision"
                    : `Editing Revision ${planningRevisionNumber}`}
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                {editModeError
                  ? editModeError
                  : "Changes save to this existing Planning record. Earlier revision snapshots, signatures, reviews, and audit history remain preserved."}
              </p>
            </div>

            {!editModeLoading &&
            !editModeError &&
            planningRecordId ? (
              <Link
                href={`/planning/${planningRecordId}`}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
              >
                View Record
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Progress */}
      <WizardProgress
        currentStep={
          currentStep
        }
      />

      {/* STEP 1 */}
      {currentStep === 1 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  lg:flex-row
                  lg:items-end
                  lg:justify-between
                "
              >
                <StepHeading
                  number="01"
                  eyebrow="Start Here"
                  title="What are you planning?"
                  description="Select the planning document required for the work. Qoreva will adjust the questions, requirements, hazards, controls, and review workflow based on this selection."
                />

                <div className="w-full lg:max-w-xs">
                  <label
                    htmlFor="plan-type-search"
                    className="
                      mb-2
                      block
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-[var(--qoreva-muted)]
                    "
                  >
                    Find a plan
                    type
                  </label>

                  <input
                    id="plan-type-search"
                    type="search"
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Search planning types..."
                    className={
                      fieldClassName
                    }
                  />
                </div>
              </div>
            </div>

            <div
              className="
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <div
                className="
                  mb-5
                  rounded-2xl
                  border
                  border-[rgba(102,87,232,0.18)]
                  bg-[var(--qoreva-violet-faint)]
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--qoreva-violet)]
                      text-xs
                      font-black
                      text-white
                    "
                  >
                    Q
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-[var(--qoreva-obsidian)]
                      "
                    >
                      Qoreva™
                      Planning Engine
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-medium
                        leading-5
                        text-[var(--qoreva-muted)]
                      "
                    >
                      PTP is the
                      recommended
                      general-purpose
                      planning
                      workflow.
                      Project or owner
                      requirements
                      may require a
                      different or
                      additional
                      planning
                      document.
                    </p>
                  </div>
                </div>
              </div>

              {filteredPlanTypes.length ===
              0 ? (
                <EmptySelection
                  title="No planning types found."
                  description="Try a different search."
                />
              ) : (
                <div
                  className="
                    grid
                    gap-4
                    md:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {filteredPlanTypes.map(
                    (
                      planType,
                    ) => {
                      const selected =
                        selectedPlanType ===
                        planType.type;

                      return (
                        <button
                          key={
                            planType.type
                          }
                          type="button"
                          onClick={() => {
                            setSelectedPlanType(
                              planType.type,
                            );

                            setStepError(
                              "",
                            );
                          }}
                          className={`
                            group
                            relative
                            min-h-48
                            rounded-2xl
                            border
                            p-5
                            text-left
                            shadow-[var(--qoreva-shadow-sm)]
                            transition-all
                            duration-150

                            ${
                              selected
                                ? `
                                  border-[var(--qoreva-violet)]
                                  bg-[var(--qoreva-violet-faint)]
                                  ring-4
                                  ring-[rgba(102,87,232,0.08)]
                                `
                                : `
                                  border-[var(--qoreva-border)]
                                  bg-white
                                  hover:-translate-y-px
                                  hover:border-[rgba(102,87,232,0.28)]
                                `
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className={`
                                flex
                                h-11
                                min-w-11
                                items-center
                                justify-center
                                rounded-xl
                                px-2.5
                                text-xs
                                font-black

                                ${
                                  selected
                                    ? `
                                      bg-[var(--qoreva-violet)]
                                      text-white
                                    `
                                    : `
                                      bg-[var(--qoreva-violet-soft)]
                                      text-[var(--qoreva-violet-dark)]
                                    `
                                }
                              `}
                            >
                              {
                                planType.type
                              }
                            </div>

                            {planType.recommended ? (
                              <span
                                className="
                                  rounded-full
                                  border
                                  border-[rgba(102,87,232,0.18)]
                                  bg-white
                                  px-2.5
                                  py-1
                                  text-[9px]
                                  font-black
                                  uppercase
                                  tracking-[0.08em]
                                  text-[var(--qoreva-violet-dark)]
                                "
                              >
                                Recommended
                              </span>
                            ) : null}
                          </div>

                          <p
                            className="
                              mt-4
                              text-base
                              font-black
                              text-[var(--qoreva-obsidian)]
                            "
                          >
                            {
                              planType.title
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              font-bold
                              uppercase
                              tracking-[0.08em]
                              text-[var(--qoreva-muted)]
                            "
                          >
                            {
                              planType.category
                            }
                          </p>

                          <p
                            className="
                              mt-3
                              text-sm
                              font-medium
                              leading-5
                              text-[var(--qoreva-muted)]
                            "
                          >
                            {
                              planType.description
                            }
                          </p>

                          <div className="mt-5 flex items-center gap-2">
                            <span
                              className={`
                                flex
                                h-5
                                w-5
                                items-center
                                justify-center
                                rounded-full
                                border

                                ${
                                  selected
                                    ? `
                                      border-[var(--qoreva-violet)]
                                      bg-[var(--qoreva-violet)]
                                      text-white
                                    `
                                    : `
                                      border-[var(--qoreva-border-strong)]
                                      bg-white
                                    `
                                }
                              `}
                            >
                              {selected ? (
                                <CheckIcon />
                              ) : null}
                            </span>

                            <span
                              className={`
                                text-xs
                                font-black

                                ${
                                  selected
                                    ? "text-[var(--qoreva-violet-dark)]"
                                    : "text-[var(--qoreva-muted)]"
                                }
                              `}
                            >
                              {selected
                                ? "Selected"
                                : "Select plan"}
                            </span>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </section>

          {selectedDefinition ? (
            <section
              className="
                rounded-[1.75rem]
                border
                border-[rgba(102,87,232,0.20)]
                bg-white
                p-5
                shadow-[var(--qoreva-shadow-sm)]
                sm:p-6
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-5
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                "
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      flex
                      h-12
                      min-w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[var(--qoreva-violet)]
                      px-3
                      text-xs
                      font-black
                      text-white
                    "
                  >
                    {
                      selectedDefinition.type
                    }
                  </div>

                  <div>
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-[var(--qoreva-violet)]
                      "
                    >
                      Selected Plan
                    </p>

                    <h3
                      className="
                        mt-1
                        text-xl
                        font-black
                        text-[var(--qoreva-obsidian)]
                      "
                    >
                      {
                        selectedDefinition.title
                      }
                    </h3>

                    <p
                      className="
                        mt-1
                        max-w-2xl
                        text-sm
                        font-medium
                        leading-6
                        text-[var(--qoreva-muted)]
                      "
                    >
                      {
                        selectedDefinition.description
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    continueFromPlanType
                  }
                  className={
                    primaryButtonClassName
                  }
                >
                  Continue to Project
                  & Contractor →
                </button>
              </div>
            </section>
          ) : (
            <section
              className="
                rounded-[1.75rem]
                border
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                px-5
                py-4
              "
            >
              <p
                className="
                  text-center
                  text-sm
                  font-bold
                  text-[var(--qoreva-muted)]
                "
              >
                Select a plan type
                above to continue.
              </p>
            </section>
          )}
        </>
      ) : null}

      {/* STEP 2 */}
      {currentStep === 2 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="02"
                eyebrow="Work Assignment"
                title="Where is the work happening?"
                description="Connect this plan to the actual project and performing contractor. Qoreva will use these selections to determine the requirements and safety documents that apply in the next step."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              {optionsError ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-[#F0BDC4]
                    bg-[var(--qoreva-danger-soft)]
                    px-4
                    py-3
                    text-sm
                    font-black
                    text-[var(--qoreva-danger)]
                  "
                >
                  {
                    optionsError
                  }
                </div>
              ) : null}

              {requirementsError ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-[#F0BDC4]
                    bg-[var(--qoreva-danger-soft)]
                    px-4
                    py-3
                    text-sm
                    font-black
                    text-[var(--qoreva-danger)]
                  "
                >
                  {requirementsError}
                </div>
              ) : null}

              <section
                className="
                  rounded-2xl
                  border
                  border-[var(--qoreva-border)]
                  bg-white
                  p-5
                  shadow-[var(--qoreva-shadow-sm)]
                "
              >
                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-2
                  "
                >
                  <SelectControl
                    label="Project"
                    value={
                      selectedProjectId
                    }
                    disabled={
                      optionsLoading
                    }
                    onChange={
                      handleProjectChange
                    }
                    options={[
                      {
                        value: "",
                        label:
                          optionsLoading
                            ? "Loading projects..."
                            : "Select project",
                      },

                      ...projects.map(
                        (
                          project,
                        ) => ({
                          value:
                            project.id,

                          label:
                            project.projectCode
                              ? `${project.name} — ${project.projectCode}`
                              : project.name,
                        }),
                      ),
                    ]}
                  />

                  <SelectControl
                    label="Performing Contractor"
                    value={
                      selectedContractorId
                    }
                    disabled={
                      optionsLoading ||
                      !selectedProjectId
                    }
                    onChange={(
                      value,
                    ) => {
                      setSelectedContractorId(
                        value,
                      );

                      setStepError(
                        "",
                      );
                    }}
                    options={[
                      {
                        value: "",

                        label:
                          !selectedProjectId
                            ? "Select a project first"
                            : projectContractors.length ===
                                0
                              ? "No contractors assigned to this project"
                              : "Select contractor",
                      },

                      ...projectContractors.map(
                        (
                          contractor,
                        ) => ({
                          value:
                            contractor.id,

                          label:
                            contractor.trade
                              ? `${contractor.name} — ${contractor.trade}`
                              : contractor.name,
                        }),
                      ),
                    ]}
                  />

                  <TextControl
                    label="Responsible Supervisor / Foreman"
                    value={
                      responsibleSupervisor
                    }
                    placeholder="Enter name"
                    onChange={
                      setResponsibleSupervisor
                    }
                  />

                  <TextControl
                    label="Planned Start Date"
                    value={
                      plannedStartDate
                    }
                    type="date"
                    onChange={
                      setPlannedStartDate
                    }
                  />

                  <div className="md:col-span-2">
                    <TextControl
                      label="Work Location / Area"
                      value={
                        workLocation
                      }
                      placeholder="Example: Building C • Zone 4"
                      onChange={
                        setWorkLocation
                      }
                    />
                  </div>
                </div>
              </section>

              {selectedProject ? (
                <section
                  className="
                    grid
                    gap-4
                    lg:grid-cols-2
                  "
                >
                  <ContextCard
                    eyebrow="Project Context"
                    title={
                      selectedProject.name
                    }
                    items={[
                      {
                        label:
                          "Project Code",

                        value:
                          selectedProject.projectCode ||
                          "Not entered",
                      },
                      {
                        label:
                          "Owner / Client",

                        value:
                          selectedProject.clientName ||
                          "Not entered",
                      },
                      {
                        label:
                          "Managing Company",

                        value:
                          selectedProject.company
                            .name,
                      },
                      {
                        label:
                          "Project Status",

                        value:
                          selectedProject.status,
                      },
                    ]}
                  />

                  {selectedContractor ? (
                    <ContextCard
                      eyebrow="Contractor Context"
                      title={
                        selectedContractor.name
                      }
                      items={[
                        {
                          label:
                            "Company",

                          value:
                            selectedContractor.company
                              .name,
                        },
                        {
                          label:
                            "Trade",

                          value:
                            selectedContractor.trade ||
                            "Not entered",
                        },
                        {
                          label:
                            "Approval",

                          value:
                            selectedContractor.approvalStatus,
                        },
                        {
                          label:
                            "Compliance",

                          value:
                            selectedContractor.complianceStatus,
                        },
                      ]}
                    />
                  ) : (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-dashed
                        border-[var(--qoreva-border-strong)]
                        bg-white
                        p-5
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-black
                          text-[var(--qoreva-obsidian)]
                        "
                      >
                        Contractor
                        context
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-medium
                          leading-6
                          text-[var(--qoreva-muted)]
                        "
                      >
                        Select the
                        performing
                        contractor to
                        preview
                        readiness and
                        compliance
                        context.
                      </p>
                    </div>
                  )}
                </section>
              ) : null}

              <div
                className="
                  rounded-2xl
                  border
                  border-[rgba(102,87,232,0.18)]
                  bg-[var(--qoreva-violet-faint)]
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--qoreva-violet-soft)]
                      text-xs
                      font-black
                      text-[var(--qoreva-violet-dark)]
                    "
                  >
                    03
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-[var(--qoreva-obsidian)]
                      "
                    >
                      Next:
                      Requirements &
                      Safety Documents
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-medium
                        leading-5
                        text-[var(--qoreva-muted)]
                      "
                    >
                      Qoreva will use
                      this project and
                      contractor
                      relationship to
                      bring forward
                      applicable owner
                      and project
                      requirements,
                      contractor
                      documentation,
                      and safety
                      manuals for the
                      plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={
                goBackOneStep
              }
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Plan Type
            </button>

            <button
              type="button"
              onClick={
                continueFromAssignment
              }
              disabled={
                requirementsLoading ||
                planningDraftSaving
              }
              className={`
                ${primaryButtonClassName}
                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            >
              {planningDraftSaving
                ? "Saving Draft..."
                : requirementsLoading
                  ? "Loading Requirements..."
                  : "Continue to Requirements & Documents →"}
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 3 */}
      {currentStep === 3 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="03"
                eyebrow="Source Intelligence"
                title="Requirements & Safety Documents"
                description="Review the requirements and source documents Qoreva found for this project and contractor. Select the documents Qoreva may reference while assisting with this plan."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              {requirementsError ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-[#F0BDC4]
                    bg-[var(--qoreva-danger-soft)]
                    px-4
                    py-3
                    text-sm
                    font-black
                    text-[var(--qoreva-danger)]
                  "
                >
                  {requirementsError}
                </div>
              ) : null}

              {!requirementsData ? (
                <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-8 text-center">
                  <p className="font-black text-[var(--qoreva-obsidian)]">
                    Requirements are not loaded.
                  </p>

                  <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                    Return to Assignment and reload the project and contractor context.
                  </p>
                </div>
              ) : (
                <>
                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StepMetric
                      label="Required Items"
                      value={requirementsData.summary.requiredRequirements}
                      detail="Project requirements"
                      tone="neutral"
                    />

                    <StepMetric
                      label="Approved Matches"
                      value={requirementsData.summary.requirementsWithApprovedDocuments}
                      detail="Requirements with approved documents"
                      tone={
                        requirementsData.summary.requiredRequirements > 0 &&
                        requirementsData.summary.requirementsWithApprovedDocuments <
                          requirementsData.summary.requiredRequirements
                          ? "warning"
                          : "success"
                      }
                    />

                    <StepMetric
                      label="AI-Ready Documents"
                      value={requirementsData.summary.aiReadyDocuments}
                      detail="Processed source documents"
                      tone={
                        requirementsData.summary.aiReadyDocuments > 0
                          ? "success"
                          : "neutral"
                      }
                    />

                    <StepMetric
                      label="Expired Documents"
                      value={requirementsData.summary.expiredDocuments}
                      detail="Excluded from automatic selection"
                      tone={
                        requirementsData.summary.expiredDocuments > 0
                          ? "danger"
                          : "neutral"
                      }
                    />
                  </section>

                  <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                          Project / Owner Requirements
                        </p>

                        <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                          Applicable Requirement Checklist
                        </h3>

                        <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          These requirements come from the selected project requirement configuration. A document match does not mean the item is approved or suitable for planning use.
                        </p>
                      </div>

                      <span className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-muted)]">
                        {requirementsData.requirements.length} requirement
                        {requirementsData.requirements.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {requirementsData.requirements.length === 0 ? (
                      <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          No project document requirements configured.
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                          This project can still use contractor and plan-specific safety documents.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-3">
                        {requirementsData.requirements.map((requirement) => (
                          <RequirementRow
                            key={requirement.id}
                            requirement={requirement}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                          Contractor Safety Documents
                        </p>

                        <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                          Select Planning Sources
                        </h3>

                        <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          Qoreva can reference selected documents later in the guided planning workflow. Rejected or expired documents remain visible for context but are not automatically eligible.
                        </p>
                      </div>

                      <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                        {selectedDocumentIds.length} selected
                      </span>
                    </div>

                    {requirementsData.documents.length === 0 ? (
                      <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          No contractor documents available.
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                          Upload supporting documents below or add documents to the contractor record.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4">
                        {requirementsData.documents.map((document) => (
                          <PlanningDocumentCard
                            key={document.id}
                            document={document}
                            selected={selectedDocumentIds.includes(document.id)}
                            onToggle={() => togglePlanningDocument(document)}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                        Plan-Specific Documents
                      </p>

                      <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                        Add Supporting Files
                      </h3>

                      <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        Add drawings, procedures, permits, equipment information, or other files that apply only to this plan. These files are staged locally for now; persistent upload will be connected next.
                      </p>
                    </div>

                    <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] px-6 py-10 text-center transition hover:border-[rgba(102,87,232,0.32)] hover:bg-[var(--qoreva-violet-faint)]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet-soft)] text-lg font-black text-[var(--qoreva-violet-dark)]">
                        +
                      </span>

                      <span className="mt-3 text-sm font-black text-[var(--qoreva-obsidian)]">
                        Add supporting documents
                      </span>

                      <span className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                        PDF, image, spreadsheet, or other project-supporting file
                      </span>

                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          setPlanSpecificFiles((current) => [
                            ...current,
                            ...files,
                          ]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {planSpecificFiles.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {planSpecificFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-4 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[var(--qoreva-obsidian)]">
                                {file.name}
                              </p>

                              <p className="mt-0.5 text-xs font-medium text-[var(--qoreva-muted)]">
                                {formatFileSize(file.size)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setPlanSpecificFiles((current) =>
                                  current.filter((_, fileIndex) => fileIndex !== index),
                                )
                              }
                              className="shrink-0 rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1.5 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                        AI
                      </div>

                      <div>
                        <h3 className="font-black text-[var(--qoreva-obsidian)]">
                          Planning source control
                        </h3>

                        <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          Qoreva will only use selected source documents when planning intelligence is connected. Documents that are rejected, expired, or not processed remain visible but are not treated as trusted planning sources automatically. Qualified users review the final plan.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Assignment
            </button>

            <button
              type="button"
              onClick={continueFromRequirements}
              className={primaryButtonClassName}
            >
              Continue to Work Scope →
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 4 */}
      {currentStep === 4 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="04"
                eyebrow="Define the Work"
                title="Work Scope"
                description="Describe what the crew will actually do. Qoreva will use this scope, the selected requirements, and the selected safety documents to guide hazard and control planning in the next step."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextControl
                      label="Work Activity / Task Title"
                      value={scopeTitle}
                      placeholder="Example: Install 4-inch underground conduit"
                      onChange={(value) => {
                        setScopeTitle(value);
                        setStepError("");
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextareaControl
                      label="Detailed Scope of Work"
                      value={scopeDescription}
                      placeholder="Describe what the crew will perform, how the work is expected to progress, and the finished condition."
                      rows={5}
                      onChange={(value) => {
                        setScopeDescription(value);
                        setStepError("");
                      }}
                    />
                  </div>

                  <TextControl
                    label="Work Location / Area"
                    value={workLocation}
                    placeholder="Example: Building C • Zone 4"
                    onChange={setWorkLocation}
                  />

                  <TextControl
                    label="Expected Crew Size"
                    value={crewSize}
                    placeholder="Example: 6"
                    type="number"
                    onChange={setCrewSize}
                  />

                  <SelectControl
                    label="Shift"
                    value={shift}
                    onChange={setShift}
                    options={[
                      {
                        value: "Day",
                        label: "Day Shift",
                      },
                      {
                        value: "Afternoon",
                        label: "Afternoon Shift",
                      },
                      {
                        value: "Night",
                        label: "Night Shift",
                      },
                      {
                        value: "Shutdown / Outage",
                        label: "Shutdown / Outage",
                      },
                      {
                        value: "Other",
                        label: "Other",
                      },
                    ]}
                  />

                  <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                      Planning Context
                    </p>

                    <p className="mt-2 text-sm font-black text-[var(--qoreva-obsidian)]">
                      {selectedProject?.name || "Project not selected"}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                      {selectedContractor?.name || "Contractor not selected"} •{" "}
                      {responsibleSupervisor || "Supervisor not entered"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Work Sequence
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Major Work Steps
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Enter the expected order of work. Keep each step focused on one major activity so hazards and controls can be reviewed against the actual sequence.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addWorkSequenceStep}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(102,87,232,0.22)] bg-[var(--qoreva-violet-soft)] px-4 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)]"
                  >
                    + Add Work Step
                  </button>
                </div>

                <div className="mt-5 grid gap-4">
                  {workSequence.map((step, index) => (
                    <article
                      key={step.id}
                      className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--qoreva-obsidian)] text-[10px] font-black text-[#B9B0FF]">
                            {index + 1}
                          </span>

                          <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                            Work Step {index + 1}
                          </p>
                        </div>

                        {workSequence.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeWorkSequenceStep(step.id)
                            }
                            className="rounded-lg border border-[#F0BDC4] bg-white px-3 py-1.5 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)]"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-4">
                        <TextControl
                          label="Step Title"
                          value={step.title}
                          placeholder="Example: Set up bore machine and work zone"
                          onChange={(value) => {
                            updateWorkSequenceStep(
                              step.id,
                              "title",
                              value,
                            );
                            setStepError("");
                          }}
                        />

                        <TextareaControl
                          label="Step Description"
                          value={step.description}
                          placeholder="Briefly describe what happens during this step."
                          rows={3}
                          onChange={(value) =>
                            updateWorkSequenceStep(
                              step.id,
                              "description",
                              value,
                            )
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <TextareaCard
                  eyebrow="Equipment & Tools"
                  title="What equipment or tools will be used?"
                  description="Include mobile equipment, powered tools, hand tools, specialty equipment, access equipment, testing equipment, and similar items."
                  value={equipmentTools}
                  placeholder="Example: excavator, directional drill, vacuum excavator, generator, cordless tools, multimeter..."
                  onChange={setEquipmentTools}
                />

                <TextareaCard
                  eyebrow="Materials & Chemicals"
                  title="What materials or chemicals are involved?"
                  description="Include installed materials, fuels, coatings, adhesives, gases, chemicals, concrete products, or other substances the crew may handle."
                  value={materialsChemicals}
                  placeholder="Example: PVC conduit, primer/cement, diesel fuel, marking paint..."
                  onChange={setMaterialsChemicals}
                />

                <TextareaCard
                  eyebrow="Work Interfaces"
                  title="What work or people could interact with this task?"
                  description="Identify other contractors, pedestrians, occupied areas, traffic, deliveries, cranes, simultaneous operations, energized systems, or nearby work."
                  value={adjacentWork}
                  placeholder="Example: active roadway traffic, crane operations nearby, other contractors crossing the work zone..."
                  onChange={setAdjacentWork}
                />

                <TextareaCard
                  eyebrow="Special Conditions"
                  title="Are there unusual site or operating conditions?"
                  description="Capture shutdown/outage conditions, live plant operations, restricted areas, environmental limitations, weather-sensitive work, night work, or other special conditions."
                  value={specialConditions}
                  placeholder="Example: live manufacturing area, outage window, work near active utilities..."
                  onChange={setSpecialConditions}
                />
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet-soft)] text-xs font-black text-[var(--qoreva-violet-dark)]">
                    AI
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Activity Detection
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Qoreva will analyze the work you described
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      When you continue, Qoreva analyzes the scope, equipment, materials, interfaces, conditions, and work sequence to suggest the activities that apply. You confirm the detected activities before they control the guided questions. Qoreva assists; the foreman and qualified reviewers remain responsible for the final planning decisions.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    05
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Next: Guided Planning
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Qoreva will analyze the work scope and suggest applicable activities first. After you confirm those activities, the Guided Questions Engine will ask only the questions that apply while preserving work-step hazard, control, risk, PPE, permit, and emergency planning. The user still reviews and answers the planning questions.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Requirements
            </button>

            <button
              type="button"
              onClick={continueFromScope}
              disabled={
                planningDraftSaving ||
                activityDetectionLoading
              }
              className={`
                ${primaryButtonClassName}
                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            >
              {activityDetectionLoading
                ? "Analyzing Work Activities..."
                : planningDraftSaving
                  ? "Saving Work Scope..."
                  : "Analyze Scope & Continue →"}
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 5 */}
      {currentStep === 5 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="05"
                eyebrow="Guided Planning"
                title="Plan the Work Safely"
                description="Confirm the activities Qoreva detected, then answer only the planning questions that apply. Questions can appear dynamically as prior answers trigger additional requirements. Qualified people remain responsible for the final safety decisions."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StepMetric
                  label="Questions"
                  value={planningProgress.total}
                  detail="Applicable planning questions"
                  tone="neutral"
                />

                <StepMetric
                  label="Answered"
                  value={planningProgress.answered}
                  detail={`${planningProgress.percent}% complete`}
                  tone={
                    planningProgress.percent === 100
                      ? "success"
                      : "neutral"
                  }
                />

                <StepMetric
                  label="Critical Open"
                  value={planningProgress.criticalUnresolved}
                  detail="Safety-critical questions unanswered"
                  tone={
                    planningProgress.criticalUnresolved > 0
                      ? "warning"
                      : "success"
                  }
                />

                <StepMetric
                  label="Work Steps"
                  value={
                    workSequence.filter(
                      (step) =>
                        step.title.trim() ||
                        step.description.trim(),
                    ).length
                  }
                  detail="Steps requiring hazard review"
                  tone="neutral"
                />
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    Q
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Why these questions?
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      The question set is evaluated from the confirmed activities and your prior answers. Qoreva only reveals follow-up questions when their deterministic rules apply. Owner, GC, company, and project Requirement Packs can later add required questions without hardcoding one customer into the workflow.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Detected Activities
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Confirm what applies to this work
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Qoreva suggested these activities from the scope you entered. Remove any activity that does not apply. If the suggestions are incomplete, return to Work Scope and add the missing work detail before proceeding.
                    </p>
                  </div>

                  <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                    {confirmedActivityCodes.length} confirmed
                  </span>
                </div>

                {activityDetectionError ? (
                  <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)]">
                    {activityDetectionError}
                  </div>
                ) : null}

                {detectedActivities.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-4">
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      No specific activity was detected.
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                      The Qoreva core questions will still be evaluated. Return to Work Scope if the description needs more detail.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {detectedActivities.map((activity) => {
                      const confirmed =
                        confirmedActivityCodes.includes(
                          activity.activityCode,
                        );

                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() =>
                            toggleConfirmedActivity(
                              activity.activityCode,
                            )
                          }
                          aria-pressed={confirmed}
                          className={`rounded-xl border p-4 text-left transition ${
                            confirmed
                              ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)] ring-4 ring-[rgba(102,87,232,0.06)]"
                              : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] hover:border-[rgba(102,87,232,0.28)]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                confirmed
                                  ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white"
                                  : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
                              }`}
                            >
                              <CheckIcon />
                            </span>

                            <span className="min-w-0">
                              <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                                {activity.name}
                              </span>
                              <span className="mt-1 block text-xs font-medium text-[var(--qoreva-muted)]">
                                {activity.category} • Match {activity.score}
                              </span>
                              {activity.matchedKeywords.length > 0 ? (
                                <span className="mt-1 block text-[10px] font-bold text-[var(--qoreva-subtle)]">
                                  Matched: {activity.matchedKeywords.join(", ")}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                    Work-Step Hazard Review
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                    Hazards & Controls by Work Step
                  </h3>

                  <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    Review each major activity from the work sequence. Identify the credible hazards, select the work-step risk level, and document the controls that will be in place before the crew performs that step.
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  {workSequence
                    .filter(
                      (step) =>
                        step.title.trim() ||
                        step.description.trim(),
                    )
                    .map((step, index) => {
                      const planning =
                        workStepPlanning[step.id] ?? {
                          hazards: "",
                          controls: "",
                          safetyCritical: false,
                          riskLevel: "",
                        };

                      return (
                        <article
                          key={step.id}
                          className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-obsidian)] text-[11px] font-black text-[#B9B0FF]">
                                {index + 1}
                              </span>

                              <div>
                                <h4 className="font-black text-[var(--qoreva-obsidian)]">
                                  {step.title}
                                </h4>

                                {step.description ? (
                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    {step.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateWorkStepPlanning(
                                  step.id,
                                  "safetyCritical",
                                  !planning.safetyCritical,
                                )
                              }
                              className={`inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                                planning.safetyCritical
                                  ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                                  : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                  planning.safetyCritical
                                    ? "border-[var(--qoreva-danger)] bg-[var(--qoreva-danger)] text-white"
                                    : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
                                }`}
                              >
                                <CheckIcon />
                              </span>
                              Safety-Critical Step
                            </button>
                          </div>

                          <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                  Work Step Risk Level
                                </p>

                                <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                  Select the overall risk level for this work step after considering the credible hazards and the controls that will be used.
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
                                {(["Low", "Medium", "High"] as const).map(
                                  (riskLevel) => {
                                    const selected =
                                      planning.riskLevel === riskLevel;

                                    const riskClasses =
                                      riskLevel === "Low"
                                        ? selected
                                          ? "border-[#8ED1B1] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                                          : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:border-[#8ED1B1]"
                                        : riskLevel === "Medium"
                                          ? selected
                                            ? "border-[#E8C276] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
                                            : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:border-[#E8C276]"
                                          : selected
                                            ? "border-[#E99BA7] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                                            : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:border-[#E99BA7]";

                                    return (
                                      <button
                                        key={riskLevel}
                                        type="button"
                                        onClick={() =>
                                          updateWorkStepPlanning(
                                            step.id,
                                            "riskLevel",
                                            riskLevel,
                                          )
                                        }
                                        aria-pressed={selected}
                                        className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-black transition ${riskClasses}`}
                                      >
                                        {riskLevel}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            {planning.riskLevel === "High" ? (
                              <div className="mt-3 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-3 py-2 text-xs font-bold leading-5 text-[var(--qoreva-danger)]">
                                High-risk work should receive additional verification and qualified review before the plan becomes an official field record.
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <TextareaControl
                              label="Hazards / What Could Go Wrong?"
                              value={planning.hazards}
                              placeholder="Identify credible hazards for this step, including serious injury/fatality exposures."
                              rows={4}
                              onChange={(value) =>
                                updateWorkStepPlanning(
                                  step.id,
                                  "hazards",
                                  value,
                                )
                              }
                            />

                            <TextareaControl
                              label="Controls / How Will the Crew Prevent It?"
                              value={planning.controls}
                              placeholder="Describe specific controls, verification steps, competent-person actions, barriers, permits, procedures, or PPE."
                              rows={4}
                              onChange={(value) =>
                                updateWorkStepPlanning(
                                  step.id,
                                  "controls",
                                  value,
                                )
                              }
                            />
                          </div>
                        </article>
                      );
                    })}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Dynamic Planning Questions
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Confirm the Critical Planning Details
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Answer the questions that apply. Add notes whenever a response needs explanation, a specific method, or a project requirement.
                    </p>
                  </div>

                  <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                    {planningProgress.answered}/{planningProgress.total} answered
                  </span>
                </div>

                {guidedQuestionsError ? (
                  <div className="mt-5 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)]">
                    {guidedQuestionsError}
                  </div>
                ) : null}

                {guidedQuestionsLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--qoreva-muted)]">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--qoreva-violet)]" />
                    Checking for additional applicable questions...
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4">
                    {guidedPlanningQuestions
                      .filter(
                        (question) =>
                          question.category !== "Core",
                      )
                      .map((question, index) => {
                        const answer =
                          planningAnswers[
                            question.questionCode
                          ] ?? {
                            value: "",
                            notes: "",
                          };

                        return (
                          <article
                            key={question.id}
                            className={`rounded-2xl border p-4 ${
                              question.isCritical
                                ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)]"
                                : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                                {index + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                                    {question.category}
                                    {question.section
                                      ? ` • ${question.section}`
                                      : ""}
                                  </p>

                                  {question.isCritical ? (
                                    <span className="rounded-full border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-danger)]">
                                      Safety Critical
                                    </span>
                                  ) : null}
                                </div>

                                <h4 className="mt-1 font-black leading-6 text-[var(--qoreva-obsidian)]">
                                  {question.questionText}
                                </h4>

                                {question.helpText ? (
                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    {question.helpText}
                                  </p>
                                ) : null}

                                <DynamicPlanningQuestionInput
                                  question={question}
                                  value={answer.value}
                                  onChange={(value) =>
                                    updatePlanningAnswer(
                                      question.questionCode,
                                      "value",
                                      value,
                                    )
                                  }
                                />

                                <textarea
                                  value={answer.notes}
                                  rows={2}
                                  placeholder="Add task-specific details, method, verification, or explanation..."
                                  onChange={(event) =>
                                    updatePlanningAnswer(
                                      question.questionCode,
                                      "notes",
                                      event.target.value,
                                    )
                                  }
                                  className={`mt-3 ${textareaClassName}`}
                                />
                              </div>
                            </div>
                          </article>
                        );
                      })}

                    {guidedPlanningQuestions.filter(
                      (question) =>
                        question.category !== "Core",
                    ).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
                        <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                          No additional activity questions apply yet.
                        </p>
                        <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                          Qoreva has the core scope information from Step 4. Confirm the detected activities above or return to Work Scope if more detail is needed.
                        </p>
                      </div>
                    ) : null}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <TextareaCard
                  eyebrow="PPE"
                  title="Task-Specific PPE"
                  description="Document PPE beyond the normal project minimum and tie it to the actual task exposure."
                  value={requiredPpe}
                  placeholder="Example: cut-resistant gloves, face shield, hearing protection, arc-rated PPE, respiratory protection..."
                  onChange={setRequiredPpe}
                />

                <TextareaCard
                  eyebrow="Permits & Authorizations"
                  title="Required Permits / Approvals"
                  description="List permits, owner approvals, notifications, or authorizations required before or during this work."
                  value={requiredPermits}
                  placeholder="Example: excavation permit, hot-work permit, energized-work approval, lift plan..."
                  onChange={setRequiredPermits}
                />

                <TextareaCard
                  eyebrow="Emergency Planning"
                  title="Task-Specific Emergency Response"
                  description="Describe what the crew will do for foreseeable task emergencies and how help will be summoned."
                  value={emergencyPlan}
                  placeholder="Example: utility strike response, fire response, rescue method, spill response, emergency contacts..."
                  onChange={(value) => {
                    setEmergencyPlan(value);
                    setStepError("");
                  }}
                />

                <TextareaCard
                  eyebrow="Stop-Work Triggers"
                  title="When must the crew stop and reassess?"
                  description="Define conditions that invalidate the plan or require the crew to stop, notify supervision, and revise the plan."
                  value={stopWorkTriggers}
                  placeholder="Example: unknown utility discovered, weather threshold reached, isolation cannot be verified, work area changes..."
                  onChange={setStopWorkTriggers}
                />
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <TextareaControl
                  label="Additional Planning Notes"
                  value={planningNotes}
                  rows={4}
                  placeholder="Document other planning details, assumptions, coordination needs, or items that should be carried into the final plan."
                  onChange={setPlanningNotes}
                />
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    06
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Next: Build the Plan
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Step 6 will assemble the assignment, source requirements, scope, work sequence, hazards, controls, PPE, permits, and emergency planning into the actual planning record. Qoreva will assist with structure and quality checks while the qualified user remains responsible for the final content.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Work Scope
            </button>

            <button
              type="button"
              onClick={continueFromGuidedPlanning}
              disabled={
                planningDraftSaving ||
                guidedQuestionsLoading
              }
              className={`
                ${primaryButtonClassName}
                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            >
              {planningDraftSaving
                ? "Saving Guided Planning..."
                : "Continue to Build Plan →"}
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 6 */}
      {currentStep === 6 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="06"
                eyebrow="Build Plan"
                title="Assemble the Draft Planning Record"
                description="Qoreva assembles the information entered in Steps 1–5 into a structured draft and performs a planning quality check. Missing or weak items are surfaced for qualified review instead of being silently invented."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StepMetric
                  label="Quality Score"
                  value={planningQualitySummary.score}
                  detail="Planning completeness check"
                  tone={
                    planningQualitySummary.actionRequired > 0
                      ? "danger"
                      : planningQualitySummary.warnings > 0
                        ? "warning"
                        : "success"
                  }
                />

                <StepMetric
                  label="High-Risk Steps"
                  value={highRiskSteps.length}
                  detail="Require focused qualified review"
                  tone={
                    highRiskSteps.length > 0
                      ? "warning"
                      : "neutral"
                  }
                />

                <StepMetric
                  label="Action Required"
                  value={planningQualitySummary.actionRequired}
                  detail="Items needing input or correction"
                  tone={
                    planningQualitySummary.actionRequired > 0
                      ? "danger"
                      : "success"
                  }
                />

                <StepMetric
                  label="Warnings"
                  value={planningQualitySummary.warnings}
                  detail="Items to confirm during review"
                  tone={
                    planningQualitySummary.warnings > 0
                      ? "warning"
                      : "success"
                  }
                />
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                      AI
                    </div>

                    <div>
                      <h3 className="font-black text-[var(--qoreva-obsidian)]">
                        Qoreva™ Draft Builder
                      </h3>

                      <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        Build a draft from the user-entered assignment, scope, work sequence, risk ratings, hazards, controls, planning answers, PPE, permits, emergency planning, and available requirement context. Qoreva does not make missing safety decisions on behalf of the qualified user.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateDraftPlan}
                    disabled={draftBuildSaving}
                    className={`
                      ${primaryButtonClassName}
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    `}
                  >
                    {draftBuildSaving
                      ? "Generating Draft..."
                      : draftGenerated
                        ? "Refresh Draft Plan"
                        : `Generate Draft ${selectedPlanType ?? "Plan"}`}
                  </button>
                </div>
              </section>

              {generatedPlanningDraft ? (
                <section className="overflow-hidden rounded-[1.75rem] border border-[rgba(102,87,232,0.22)] bg-white shadow-[var(--qoreva-shadow-sm)]">
                  <div className="border-b border-[rgba(102,87,232,0.16)] bg-[var(--qoreva-violet-faint)] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--qoreva-violet)]">
                          Qoreva Draft Intelligence
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                          Review What Qoreva Added
                        </h3>

                        <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          Qoreva analyzed the confirmed activities, planning answers,
                          work steps, and applicable requirement context. Generated
                          content remains draft planning assistance until reviewed by a
                          qualified person.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.metadata.activityCount} Activities`}
                          tone="neutral"
                        />

                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.metadata.questionCount} Questions`}
                          tone="neutral"
                        />

                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.metadata.requirementCount} Requirements`}
                          tone={
                            generatedPlanningDraft.metadata.requirementCount > 0
                              ? "success"
                              : "neutral"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-6">
                    {generatedPlanningDraft.reviewFlags.length > 0 ? (
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                          Review Attention
                        </p>

                        <div className="mt-3 grid gap-3">
                          {generatedPlanningDraft.reviewFlags.map((flag) => (
                            <div
                              key={flag.code}
                              className={`rounded-2xl border p-4 ${
                                flag.severity === "Critical"
                                  ? "border-red-200 bg-red-50"
                                  : flag.severity === "Warning"
                                    ? "border-amber-200 bg-amber-50"
                                    : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                              }`}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-black text-[var(--qoreva-obsidian)]">
                                    {flag.title}
                                  </p>

                                  <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                                    {flag.detail}
                                  </p>
                                </div>

                                <DocumentStatusBadge
                                  label={flag.severity}
                                  tone={
                                    flag.severity === "Critical"
                                      ? "danger"
                                      : flag.severity === "Warning"
                                        ? "warning"
                                        : "neutral"
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          No generation review flags
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                          Qoreva did not identify additional generation issues
                          requiring attention. Qualified review is still required.
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                        Work-Step Intelligence
                      </p>

                      <div className="mt-3 grid gap-4">
                        {generatedPlanningDraft.workSteps.map((step) => (
                          <div
                            key={`${step.sequence}-${step.title}`}
                            className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-porcelain)] p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                                  Work Step {step.sequence}
                                </p>

                                <h4 className="mt-1 font-black text-[var(--qoreva-obsidian)]">
                                  {step.title}
                                </h4>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <DocumentStatusBadge
                                  label={step.riskAttention}
                                  tone={
                                    step.riskAttention === "HighAttention" ||
                                    step.riskAttention === "Elevated"
                                      ? "warning"
                                      : "neutral"
                                  }
                                />

                                {step.safetyCriticalSuggested ? (
                                  <DocumentStatusBadge
                                    label="Safety Critical"
                                    tone="danger"
                                  />
                                ) : null}
                              </div>
                            </div>

                            {step.sourceActivityCodes.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {step.sourceActivityCodes.map((activityCode) => (
                                  <span
                                    key={activityCode}
                                    className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-violet)]"
                                  >
                                    {activityCode}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div>
                                <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                  Suggested Hazards
                                </p>

                                {step.suggestedHazards.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {step.suggestedHazards.map((hazard) => (
                                      <li
                                        key={hazard}
                                        className="flex gap-2 text-sm font-medium leading-5 text-[var(--qoreva-muted)]"
                                      >
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--qoreva-violet)]" />
                                        <span>{hazard}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
                                    No additional hazards generated.
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                  Suggested Controls
                                </p>

                                {step.suggestedControls.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {step.suggestedControls.map((control) => (
                                      <li
                                        key={control}
                                        className="flex gap-2 text-sm font-medium leading-5 text-[var(--qoreva-muted)]"
                                      >
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                        <span>{control}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
                                    No additional controls generated.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {generatedPlanningDraft.requirementControlSuggestions.length > 0 ? (
                      <div className="rounded-2xl border border-[rgba(102,87,232,0.2)] bg-[var(--qoreva-violet-faint)] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                          Requirement Pack
                        </p>

                        <h4 className="mt-1 font-black text-[var(--qoreva-obsidian)]">
                          Applicable Requirement Controls
                        </h4>

                        <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          These controls originate from applicable requirement rules
                          and remain separate from generic stop-work triggers.
                        </p>

                        <div className="mt-3 space-y-2">
                          {generatedPlanningDraft.requirementControlSuggestions.map(
                            (suggestion, index) => (
                              <div
                                key={`${suggestion.text}-${index}`}
                                className="rounded-xl border border-[rgba(102,87,232,0.16)] bg-white p-3"
                              >
                                <p className="text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                                  {suggestion.text}
                                </p>

                                {suggestion.sourceRequirementIds.length > 0 ? (
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--qoreva-muted)]">
                                    Source: {suggestion.sourceRequirementIds.length}{" "}
                                    applicable requirement
                                    {suggestion.sourceRequirementIds.length === 1
                                      ? ""
                                      : "s"}
                                  </p>
                                ) : null}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-2">
                      {[
                        {
                          title: "PPE Suggestions",
                          items: generatedPlanningDraft.ppeSuggestions,
                        },
                        {
                          title: "Permit / Authorization Suggestions",
                          items: generatedPlanningDraft.permitSuggestions,
                        },
                        {
                          title: "Emergency Planning Suggestions",
                          items: generatedPlanningDraft.emergencySuggestions,
                        },
                        {
                          title: "Stop-Work Suggestions",
                          items: generatedPlanningDraft.stopWorkSuggestions,
                        },
                      ].map((group) => (
                        <div
                          key={group.title}
                          className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4"
                        >
                          <p className="font-black text-[var(--qoreva-obsidian)]">
                            {group.title}
                          </p>

                          {group.items.length > 0 ? (
                            <ul className="mt-3 space-y-2">
                              {group.items.map((suggestion, index) => (
                                <li
                                  key={`${suggestion.text}-${index}`}
                                  className="flex gap-2 text-sm font-medium leading-5 text-[var(--qoreva-muted)]"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--qoreva-violet)]" />
                                  <span>{suggestion.text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
                              No additional suggestions generated.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          Generation Trace
                        </p>

                        <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                          Generator {generatedPlanningDraft.metadata.generatorVersion} •{" "}
                          {generatedPlanningDraft.metadata.sourceDocumentCount} selected
                          source document
                          {generatedPlanningDraft.metadata.sourceDocumentCount === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <p className="text-xs font-bold text-[var(--qoreva-muted)]">
                        AI assists. Qualified people make final decisions.
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Planning Quality Check
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Review Gaps Before Qualified Review
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      These checks are deterministic completeness and consistency checks. They help surface gaps; they do not replace professional judgment or project-specific review.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentStatusBadge
                      label={`${planningQualitySummary.passed} Passed`}
                      tone="success"
                    />

                    <DocumentStatusBadge
                      label={`${planningQualitySummary.warnings} Warnings`}
                      tone={
                        planningQualitySummary.warnings > 0
                          ? "warning"
                          : "neutral"
                      }
                    />

                    <DocumentStatusBadge
                      label={`${planningQualitySummary.actionRequired} Action Required`}
                      tone={
                        planningQualitySummary.actionRequired > 0
                          ? "danger"
                          : "neutral"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {planningQualityChecks.map((check) => (
                    <QualityCheckRow
                      key={check.id}
                      check={check}
                    />
                  ))}
                </div>
              </section>

              {!draftGenerated ? (
                <section className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-white px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--qoreva-violet-soft)] text-sm font-black text-[var(--qoreva-violet-dark)]">
                    06
                  </div>

                  <h3 className="mt-4 text-xl font-black text-[var(--qoreva-obsidian)]">
                    Draft plan not generated yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    Run the Draft Builder above to assemble the current planning information into the structured plan preview.
                  </p>
                </section>
              ) : (
                <section className="overflow-hidden rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white shadow-[var(--qoreva-shadow-sm)]">
                  <div className="border-b border-[var(--qoreva-border)] bg-[var(--qoreva-obsidian)] p-5 text-white sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B9B0FF]">
                          Draft Planning Record
                        </p>

                        <h3 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                          {scopeTitle || "Untitled Planning Record"}
                        </h3>

                        <p className="mt-2 text-sm font-medium text-white/65">
                          {selectedPlanType ?? "Planning Record"} •{" "}
                          {selectedProject?.name || "Project"} •{" "}
                          {selectedContractor?.name || "Contractor"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                          Draft
                        </span>

                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                          Quality {planningQualitySummary.score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-7 p-5 sm:p-6">
                    <PlanPreviewSection
                      eyebrow="Assignment"
                      title="Project & Work Information"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <PreviewField
                          label="Project"
                          value={
                            selectedProject?.name ||
                            "Not entered"
                          }
                        />

                        <PreviewField
                          label="Contractor"
                          value={
                            selectedContractor?.name ||
                            "Not entered"
                          }
                        />

                        <PreviewField
                          label="Responsible Supervisor"
                          value={
                            responsibleSupervisor ||
                            "Not entered"
                          }
                        />

                        <PreviewField
                          label="Planned Start"
                          value={
                            plannedStartDate
                              ? formatSimpleDate(
                                  plannedStartDate,
                                )
                              : "Not entered"
                          }
                        />

                        <PreviewField
                          label="Work Location"
                          value={
                            workLocation ||
                            "Not entered"
                          }
                        />

                        <PreviewField
                          label="Crew Size"
                          value={
                            crewSize ||
                            "Not entered"
                          }
                        />

                        <PreviewField
                          label="Shift"
                          value={shift || "Not entered"}
                        />

                        <PreviewField
                          label="Plan Type"
                          value={
                            selectedPlanType ||
                            "Not selected"
                          }
                        />
                      </div>
                    </PlanPreviewSection>

                    <PlanPreviewSection
                      eyebrow="Scope"
                      title="Scope of Work"
                    >
                      <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--qoreva-text)]">
                        {scopeDescription ||
                          "No scope entered."}
                      </p>
                    </PlanPreviewSection>

                    <PlanPreviewSection
                      eyebrow="Work Sequence"
                      title="Hazards, Controls & Risk by Work Step"
                    >
                      <div className="grid gap-4">
                        {activeWorkSteps.map(
                          (step, index) => {
                            const planning =
                              workStepPlanning[
                                step.id
                              ];

                            return (
                              <article
                                key={step.id}
                                className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-obsidian)] text-[11px] font-black text-[#B9B0FF]">
                                      {index + 1}
                                    </span>

                                    <div>
                                      <h4 className="font-black text-[var(--qoreva-obsidian)]">
                                        {step.title}
                                      </h4>

                                      {step.description ? (
                                        <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                          {step.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <RiskLevelBadge
                                      riskLevel={
                                        planning?.riskLevel ||
                                        ""
                                      }
                                    />

                                    {planning?.safetyCritical ? (
                                      <DocumentStatusBadge
                                        label="Safety-Critical"
                                        tone="danger"
                                      />
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                  <PreviewTextBlock
                                    label="Hazards / What Could Go Wrong?"
                                    value={
                                      planning?.hazards ||
                                      "Needs input"
                                    }
                                  />

                                  <PreviewTextBlock
                                    label="Controls / How Will the Crew Prevent It?"
                                    value={
                                      planning?.controls ||
                                      "Needs input"
                                    }
                                  />
                                </div>
                              </article>
                            );
                          },
                        )}
                      </div>
                    </PlanPreviewSection>

                    <PlanPreviewSection
                      eyebrow="Planning Controls"
                      title="PPE, Permits & Emergency Planning"
                    >
                      <div className="grid gap-4 lg:grid-cols-2">
                        <PreviewTextBlock
                          label="Task-Specific PPE"
                          value={
                            requiredPpe ||
                            "No task-specific PPE entered."
                          }
                        />

                        <PreviewTextBlock
                          label="Permits / Authorizations"
                          value={
                            requiredPermits ||
                            "No task-specific permits entered."
                          }
                        />

                        <PreviewTextBlock
                          label="Emergency Response"
                          value={
                            emergencyPlan ||
                            "Needs input"
                          }
                        />

                        <PreviewTextBlock
                          label="Stop-Work Triggers"
                          value={
                            stopWorkTriggers ||
                            "No task-specific stop-work triggers entered."
                          }
                        />
                      </div>
                    </PlanPreviewSection>

                    <PlanPreviewSection
                      eyebrow="Guided Planning"
                      title="Planning Question Responses"
                    >
                      <div className="grid gap-3">
                        {guidedPlanningQuestions.map(
                          (question) => {
                            const answer =
                              planningAnswers[
                                question.questionCode
                              ] ?? {
                                value: "",
                                notes: "",
                              };

                            return (
                              <article
                                key={question.id}
                                className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                                      {question.category}
                                    </p>

                                    <p className="mt-1 text-sm font-black leading-5 text-[var(--qoreva-obsidian)]">
                                      {question.questionText}
                                    </p>
                                  </div>

                                  <DocumentStatusBadge
                                    label={
                                      formatDynamicAnswer(
                                        question,
                                        answer.value,
                                      ) || "Needs Input"
                                    }
                                    tone={
                                      answer.value
                                        ? "success"
                                        : "danger"
                                    }
                                  />
                                </div>

                                {answer.notes ? (
                                  <p className="mt-3 whitespace-pre-wrap text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    {answer.notes}
                                  </p>
                                ) : null}
                              </article>
                            );
                          },
                        )}
                      </div>
                    </PlanPreviewSection>

                    <PlanPreviewSection
                      eyebrow="Source Context"
                      title="Requirements & Supporting Sources"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <PreviewField
                          label="Required Items"
                          value={String(
                            requirementsData
                              ?.summary
                              .requiredRequirements ??
                              0,
                          )}
                        />

                        <PreviewField
                          label="Approved Matches"
                          value={String(
                            requirementsData
                              ?.summary
                              .requirementsWithApprovedDocuments ??
                              0,
                          )}
                        />

                        <PreviewField
                          label="Selected Contractor Sources"
                          value={String(
                            selectedDocumentIds.length,
                          )}
                        />

                        <PreviewField
                          label="Plan-Specific Files"
                          value={String(
                            planSpecificFiles.length,
                          )}
                        />
                      </div>
                    </PlanPreviewSection>

                    {planningNotes.trim() ? (
                      <PlanPreviewSection
                        eyebrow="Additional Notes"
                        title="Planning Notes"
                      >
                        <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--qoreva-text)]">
                          {planningNotes}
                        </p>
                      </PlanPreviewSection>
                    ) : null}

                    <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                          07
                        </div>

                        <div>
                          <h3 className="font-black text-[var(--qoreva-obsidian)]">
                            Draft ready for qualified review
                          </h3>

                          <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                            Step 7 will let the qualified reviewer inspect the complete draft, return to earlier sections when changes are needed, resolve warnings, and confirm the plan before it can move to submission and signatures.
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </section>
              )}
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Guided Planning
            </button>

            <button
              type="button"
              onClick={continueFromBuildPlan}
              className={primaryButtonClassName}
            >
              Continue to Qualified Review →
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 7 */}
      {currentStep === 7 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="07"
                eyebrow="Qualified Review"
                title="Review & Confirm the Plan"
                description="A qualified person reviews the assembled draft, verifies the work steps, hazards, controls, risk levels, requirements, and emergency planning, and confirms the plan is ready to move to submission."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StepMetric
                  label="Quality Score"
                  value={planningQualitySummary.score}
                  detail="Current planning quality"
                  tone={
                    planningQualitySummary.actionRequired > 0
                      ? "danger"
                      : planningQualitySummary.warnings > 0
                        ? "warning"
                        : "success"
                  }
                />

                <StepMetric
                  label="Review Confirmed"
                  value={reviewConfirmationProgress.confirmed}
                  detail={`${reviewConfirmationProgress.percent}% of review confirmations`}
                  tone={
                    reviewConfirmationProgress.percent === 100
                      ? "success"
                      : "neutral"
                  }
                />

                <StepMetric
                  label="High-Risk Steps"
                  value={highRiskSteps.length}
                  detail="Require focused verification"
                  tone={
                    highRiskSteps.length > 0
                      ? "warning"
                      : "neutral"
                  }
                />

                <StepMetric
                  label="Open Actions"
                  value={planningQualitySummary.actionRequired}
                  detail="Must be resolved before submission"
                  tone={
                    planningQualitySummary.actionRequired > 0
                      ? "danger"
                      : "success"
                  }
                />
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    Q
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Qualified person owns the decision
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Qoreva can structure the draft, surface gaps, and assist the review. The qualified reviewer is responsible for confirming that the plan accurately reflects the work and that the selected controls are appropriate for actual field conditions.
                    </p>
                  </div>
                </div>
              </section>


              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Revision Comments
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Reviewer Issues & Requested Changes
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Add comments directly to the specific field or work item that needs correction. Open comments remain attached to that target so the submitter can return directly to the issue instead of searching through the plan.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentStatusBadge
                      label={`${reviewCommentSummary.open} Open`}
                      tone={
                        reviewCommentSummary.open > 0
                          ? "danger"
                          : "success"
                      }
                    />

                    <DocumentStatusBadge
                      label={`${reviewCommentSummary.resolved} Resolved`}
                      tone={
                        reviewCommentSummary.resolved > 0
                          ? "success"
                          : "neutral"
                      }
                    />
                  </div>
                </div>

                {reviewComments.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5">
                    <p className="font-black text-[var(--qoreva-obsidian)]">
                      No revision comments yet.
                    </p>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Use Request Revision on any reviewable item below when a specific correction or clarification is needed.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {reviewComments.map((comment) => (
                      <ReviewCommentRow
                        key={comment.id}
                        comment={comment}
                        onJump={() =>
                          jumpToReviewTarget(
                            comment.targetId,
                          )
                        }
                        onResolve={() =>
                          resolveReviewComment(
                            comment.id,
                          )
                        }
                        onReopen={() =>
                          reopenReviewComment(
                            comment.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Review Status
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Planning Quality Findings
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Resolve Action Required items before submission. Warnings may proceed only after the reviewer confirms the condition is acceptable or returns to the applicable section to update the plan.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentStatusBadge
                      label={`${planningQualitySummary.actionRequired} Action Required`}
                      tone={
                        planningQualitySummary.actionRequired > 0
                          ? "danger"
                          : "success"
                      }
                    />

                    <DocumentStatusBadge
                      label={`${planningQualitySummary.warnings} Warnings`}
                      tone={
                        planningQualitySummary.warnings > 0
                          ? "warning"
                          : "neutral"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {planningQualityChecks.map((check) => (
                    <QualityCheckRow
                      key={check.id}
                      check={check}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                    Return & Correct
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                    Need to change the plan?
                  </h3>

                  <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    Return directly to the section that needs correction. Your current planning information remains in the wizard state.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ReviewEditButton
                    label="Requirements"
                    detail="Documents & project requirements"
                    onClick={() => returnToStep(3)}
                  />

                  <ReviewEditButton
                    label="Work Scope"
                    detail="Scope, sequence & safety-critical work"
                    onClick={() => returnToStep(4)}
                  />

                  <ReviewEditButton
                    label="Guided Planning"
                    detail="Hazards, controls & risk ratings"
                    onClick={() => returnToStep(5)}
                  />

                  <ReviewEditButton
                    label="Build Plan"
                    detail="Refresh quality check & draft"
                    onClick={() => returnToStep(6)}
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white shadow-[var(--qoreva-shadow-sm)]">
                <div className="border-b border-[var(--qoreva-border)] bg-[var(--qoreva-obsidian)] p-5 text-white sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B9B0FF]">
                        Qualified Review Copy
                      </p>

                      <h3 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                        {scopeTitle || "Untitled Planning Record"}
                      </h3>

                      <p className="mt-2 text-sm font-medium text-white/65">
                        {selectedPlanType ?? "Planning Record"} •{" "}
                        {selectedProject?.name || "Project"} •{" "}
                        {selectedContractor?.name || "Contractor"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                        Qualified Review
                      </span>

                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                        Quality {planningQualitySummary.score}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-7 p-5 sm:p-6">
                  <PlanPreviewSection
                    eyebrow="Assignment"
                    title="Project & Work Information"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ReviewablePreviewField
                        targetId="review-field-project"
                        section="Assignment"
                        label="Project"
                        value={
                          selectedProject?.name ||
                          "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-contractor"
                        section="Assignment"
                        label="Contractor"
                        value={
                          selectedContractor?.name ||
                          "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-supervisor"
                        section="Assignment"
                        label="Responsible Supervisor"
                        value={
                          responsibleSupervisor ||
                          "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-start-date"
                        section="Assignment"
                        label="Planned Start"
                        value={
                          plannedStartDate
                            ? formatSimpleDate(
                                plannedStartDate,
                              )
                            : "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-location"
                        section="Assignment"
                        label="Location"
                        value={
                          workLocation ||
                          "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-crew-size"
                        section="Assignment"
                        label="Crew Size"
                        value={
                          crewSize ||
                          "Not entered"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-shift"
                        section="Assignment"
                        label="Shift"
                        value={shift || "Not entered"}
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewablePreviewField
                        targetId="review-field-plan-type"
                        section="Assignment"
                        label="Plan Type"
                        value={
                          selectedPlanType ||
                          "Not selected"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />
                    </div>
                  </PlanPreviewSection>

                  <PlanPreviewSection
                    eyebrow="Scope"
                    title="Scope of Work"
                  >
                    <ReviewableTextBlock
                      targetId="review-field-scope"
                      section="Scope"
                      label="Scope of Work"
                      value={
                        scopeDescription ||
                        "No scope entered."
                      }
                      activeTargetId={activeReviewTargetId}
                      commentDraft={reviewCommentDraft}
                      onOpenComment={openReviewComment}
                      onCommentDraftChange={setReviewCommentDraft}
                      onAddComment={addReviewComment}
                      onCancelComment={cancelReviewComment}
                    />
                  </PlanPreviewSection>

                  <PlanPreviewSection
                    eyebrow="Work Sequence"
                    title="Work Steps, Risk, Hazards & Controls"
                  >
                    <div className="grid gap-4">
                      {activeWorkSteps.map(
                        (step, index) => {
                          const planning =
                            workStepPlanning[
                              step.id
                            ];

                          return (
                            <article
                              key={step.id}
                              className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-obsidian)] text-[11px] font-black text-[#B9B0FF]">
                                    {index + 1}
                                  </span>

                                  <div>
                                    <h4 className="font-black text-[var(--qoreva-obsidian)]">
                                      {step.title}
                                    </h4>

                                    {step.description ? (
                                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                        {step.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <ReviewableRiskBadge
                                    targetId={`review-work-step-${step.id}-risk`}
                                    section={`Work Step ${index + 1}`}
                                    label={`${step.title} — Risk Level`}
                                    riskLevel={
                                      planning?.riskLevel ||
                                      ""
                                    }
                                    activeTargetId={activeReviewTargetId}
                                    commentDraft={reviewCommentDraft}
                                    onOpenComment={openReviewComment}
                                    onCommentDraftChange={setReviewCommentDraft}
                                    onAddComment={addReviewComment}
                                    onCancelComment={cancelReviewComment}
                                  />

                                  {planning?.safetyCritical ? (
                                    <DocumentStatusBadge
                                      label="Safety-Critical"
                                      tone="danger"
                                    />
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                <ReviewableTextBlock
                                  targetId={`review-work-step-${step.id}-hazards`}
                                  section={`Work Step ${index + 1}`}
                                  label={`${step.title} — Hazards`}
                                  value={
                                    planning?.hazards ||
                                    "Needs input"
                                  }
                                  activeTargetId={activeReviewTargetId}
                                  commentDraft={reviewCommentDraft}
                                  onOpenComment={openReviewComment}
                                  onCommentDraftChange={setReviewCommentDraft}
                                  onAddComment={addReviewComment}
                                  onCancelComment={cancelReviewComment}
                                />

                                <ReviewableTextBlock
                                  targetId={`review-work-step-${step.id}-controls`}
                                  section={`Work Step ${index + 1}`}
                                  label={`${step.title} — Controls`}
                                  value={
                                    planning?.controls ||
                                    "Needs input"
                                  }
                                  activeTargetId={activeReviewTargetId}
                                  commentDraft={reviewCommentDraft}
                                  onOpenComment={openReviewComment}
                                  onCommentDraftChange={setReviewCommentDraft}
                                  onAddComment={addReviewComment}
                                  onCancelComment={cancelReviewComment}
                                />
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  </PlanPreviewSection>

                  <PlanPreviewSection
                    eyebrow="Planning Controls"
                    title="PPE, Permits & Emergency Planning"
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ReviewableTextBlock
                        targetId="review-field-ppe"
                        section="Planning Controls"
                        label="Task-Specific PPE"
                        value={
                          requiredPpe ||
                          "No task-specific PPE entered."
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewableTextBlock
                        targetId="review-field-permits"
                        section="Planning Controls"
                        label="Permits / Authorizations"
                        value={
                          requiredPermits ||
                          "No task-specific permits entered."
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewableTextBlock
                        targetId="review-field-emergency"
                        section="Planning Controls"
                        label="Emergency Response"
                        value={
                          emergencyPlan ||
                          "Needs input"
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />

                      <ReviewableTextBlock
                        targetId="review-field-stop-work"
                        section="Planning Controls"
                        label="Stop-Work Triggers"
                        value={
                          stopWorkTriggers ||
                          "No task-specific stop-work triggers entered."
                        }
                        activeTargetId={activeReviewTargetId}
                        commentDraft={reviewCommentDraft}
                        onOpenComment={openReviewComment}
                        onCommentDraftChange={setReviewCommentDraft}
                        onAddComment={addReviewComment}
                        onCancelComment={cancelReviewComment}
                      />
                    </div>
                  </PlanPreviewSection>
                </div>
              </section>

              {highRiskSteps.length > 0 ? (
                <section className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-danger)] text-xs font-black text-white">
                      !
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-[var(--qoreva-danger)]">
                        High-Risk Work Review
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-text)]">
                        Confirm the following High-risk work steps receive focused verification before this plan is submitted.
                      </p>

                      <div className="mt-4 grid gap-2">
                        {highRiskSteps.map((step) => (
                          <div
                            key={step.id}
                            className="rounded-xl border border-[#F0BDC4] bg-white px-4 py-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                {step.title}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <RiskLevelBadge
                                  riskLevel="High"
                                />

                                {workStepPlanning[
                                  step.id
                                ]?.safetyCritical ? (
                                  <DocumentStatusBadge
                                    label="Safety-Critical"
                                    tone="danger"
                                  />
                                ) : (
                                  <DocumentStatusBadge
                                    label="Confirm Safety-Critical Status"
                                    tone="warning"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                    Reviewer Confirmation
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                    Confirm the plan before submission
                  </h3>

                  <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    These confirmations document the qualified review. They are not employee signatures yet; signature and approval routing will be handled in Step 8.
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  <ReviewConfirmation
                    checked={reviewConfirmations.scope}
                    title="Scope accurately reflects the work."
                    detail="The described task, location, crew, and planned conditions match the work that will actually be performed."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "scope",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.sequence}
                    title="Work sequence is complete and practical."
                    detail="The major steps are in a usable field sequence and do not omit known critical activities."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "sequence",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.hazards}
                    title="Credible hazards have been identified."
                    detail="The reviewer considered foreseeable exposures, including serious-injury/fatality potential."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "hazards",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.controls}
                    title="Controls are specific and implementable."
                    detail="Controls describe how the exposure will actually be prevented or managed in the field."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "controls",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.risk}
                    title="Work-step risk levels are appropriate."
                    detail="Low, Medium, and High ratings were reviewed against the actual hazards and selected controls."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "risk",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.requirements}
                    title="Applicable requirements and source information were considered."
                    detail="The reviewer considered applicable project/owner requirements and the status of available source documents."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "requirements",
                      )
                    }
                  />

                  <ReviewConfirmation
                    checked={reviewConfirmations.emergency}
                    title="Emergency planning and stop-work expectations are adequate."
                    detail="The crew has a task-specific response and understands when conditions require stopping and reassessing."
                    onClick={() =>
                      toggleReviewConfirmation(
                        "emergency",
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextControl
                    label="Qualified Reviewer Name"
                    value={reviewerName}
                    placeholder="Enter reviewer name"
                    onChange={(value) => {
                      setReviewerName(value);
                      setStepError("");
                    }}
                  />

                  <TextControl
                    label="Reviewer Role / Title"
                    value={reviewerRole}
                    placeholder="Example: Safety Manager"
                    onChange={(value) => {
                      setReviewerRole(value);
                      setStepError("");
                    }}
                  />

                  <div className="md:col-span-2">
                    <TextareaControl
                      label="Qualified Review Notes"
                      value={reviewNotes}
                      rows={4}
                      placeholder="Document review comments, required follow-up, accepted warnings, or other qualified-review notes."
                      onChange={setReviewNotes}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    08
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Next: Submit & Signatures
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Step 8 will create the official submission package, capture the required approval/signature roles, preserve identity/date/time/audit information, and transition the plan from Draft to its configured approval workflow.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              ← Back to Build Plan
            </button>

            <button
              type="button"
              onClick={continueFromQualifiedReview}
              disabled={qualifiedReviewSaving}
              className={`
                ${primaryButtonClassName}
                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            >
              {qualifiedReviewSaving
                ? "Saving Qualified Review..."
                : "Continue to Submit & Signatures →"}
            </button>
          </section>
        </>
      ) : null}


      {/* STEP 8 */}
      {currentStep === 8 ? (
        <>
          <section
            className="
              overflow-hidden
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <div
              className="
                border-b
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-5
                sm:p-6
              "
            >
              <StepHeading
                number="08"
                eyebrow="Submit & Signatures"
                title="Finalize the Planning Record"
                description="Complete the required signature roles, confirm the final submission package, and submit the plan. Qoreva persists the signature records, submission timestamp, revision reference, and audit event before marking the planning record Submitted."
              />
            </div>

            <div
              className="
                space-y-6
                bg-[var(--qoreva-porcelain)]
                p-5
                sm:p-6
              "
            >
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StepMetric
                  label="Quality Score"
                  value={planningQualitySummary.score}
                  detail="Final planning quality"
                  tone={
                    planningQualitySummary.actionRequired > 0
                      ? "danger"
                      : planningQualitySummary.warnings > 0
                        ? "warning"
                        : "success"
                  }
                />

                <StepMetric
                  label="Required Signatures"
                  value={submissionSignatureSummary.required}
                  detail="Configured required roles"
                  tone="neutral"
                />

                <StepMetric
                  label="Required Signed"
                  value={submissionSignatureSummary.requiredSigned}
                  detail="Completed required signatures"
                  tone={
                    submissionSignatureSummary.pendingRequired === 0
                      ? "success"
                      : "warning"
                  }
                />

                <StepMetric
                  label="Open Review Comments"
                  value={reviewCommentSummary.open}
                  detail="Must remain at zero"
                  tone={
                    reviewCommentSummary.open > 0
                      ? "danger"
                      : "success"
                  }
                />
              </section>

              {submitted ? (
                <section className="rounded-2xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-success)] text-sm font-black text-white">
                      ✓
                    </div>

                    <div>
                      <h3 className="font-black text-[var(--qoreva-success)]">
                        Planning record marked submitted
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-text)]">
                        Submitted on{" "}
                        {submittedAt
                          ? formatDateTime(
                              submittedAt,
                            )
                          : "the current session"}.
                        The submitted revision, signature records, submission timestamp, and audit event have been persisted to the Planning backend.
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-xs font-black text-white">
                    Q
                  </div>

                  <div>
                    <h3 className="font-black text-[var(--qoreva-obsidian)]">
                      Approval routing stays configurable
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      The MVP starts with the Responsible Supervisor / Foreman and Qualified Reviewer. Production signature roles should come from the plan type, tenant configuration, project settings, and applicable Owner Requirement Pack rather than being hardcoded to one owner or contractor.
                    </p>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white shadow-[var(--qoreva-shadow-sm)]">
                <div className="border-b border-[var(--qoreva-border)] bg-[var(--qoreva-obsidian)] p-5 text-white sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B9B0FF]">
                        Final Submission Package
                      </p>

                      <h3 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                        {scopeTitle || "Untitled Planning Record"}
                      </h3>

                      <p className="mt-2 text-sm font-medium text-white/65">
                        {selectedPlanType ?? "Planning Record"} •{" "}
                        {selectedProject?.name || "Project"} •{" "}
                        {selectedContractor?.name || "Contractor"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                        {submitted
                          ? "Submitted"
                          : "Ready for Signatures"}
                      </span>

                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black">
                        Quality {planningQualitySummary.score}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-7 p-5 sm:p-6">
                  <PlanPreviewSection
                    eyebrow="Assignment"
                    title="Project & Work Information"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <PreviewField
                        label="Project"
                        value={
                          selectedProject?.name ||
                          "Not entered"
                        }
                      />

                      <PreviewField
                        label="Contractor"
                        value={
                          selectedContractor?.name ||
                          "Not entered"
                        }
                      />

                      <PreviewField
                        label="Responsible Supervisor"
                        value={
                          responsibleSupervisor ||
                          "Not entered"
                        }
                      />

                      <PreviewField
                        label="Qualified Reviewer"
                        value={
                          reviewerName
                            ? `${reviewerName}${
                                reviewerRole
                                  ? ` • ${reviewerRole}`
                                  : ""
                              }`
                            : "Not entered"
                        }
                      />

                      <PreviewField
                        label="Planned Start"
                        value={
                          plannedStartDate
                            ? formatSimpleDate(
                                plannedStartDate,
                              )
                            : "Not entered"
                        }
                      />

                      <PreviewField
                        label="Work Location"
                        value={
                          workLocation ||
                          "Not entered"
                        }
                      />

                      <PreviewField
                        label="Crew Size"
                        value={
                          crewSize ||
                          "Not entered"
                        }
                      />

                      <PreviewField
                        label="Shift"
                        value={
                          shift ||
                          "Not entered"
                        }
                      />
                    </div>
                  </PlanPreviewSection>

                  <PlanPreviewSection
                    eyebrow="Final Readiness"
                    title="Submission Status"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <PreviewField
                        label="Planning Quality"
                        value={`${planningQualitySummary.score}%`}
                      />

                      <PreviewField
                        label="Action Required"
                        value={String(
                          planningQualitySummary.actionRequired,
                        )}
                      />

                      <PreviewField
                        label="Warnings"
                        value={String(
                          planningQualitySummary.warnings,
                        )}
                      />

                      <PreviewField
                        label="Open Review Comments"
                        value={String(
                          reviewCommentSummary.open,
                        )}
                      />
                    </div>
                  </PlanPreviewSection>

                  <PlanPreviewSection
                    eyebrow="High-Risk Work"
                    title="High-Risk / Safety-Critical Summary"
                  >
                    {highRiskSteps.length === 0 ? (
                      <p className="text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        No work steps are currently rated High.
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {highRiskSteps.map(
                          (step, index) => (
                            <article
                              key={step.id}
                              className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
                                    High-Risk Work Step {index + 1}
                                  </p>

                                  <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                    {step.title}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <RiskLevelBadge
                                    riskLevel="High"
                                  />

                                  {workStepPlanning[
                                    step.id
                                  ]?.safetyCritical ? (
                                    <DocumentStatusBadge
                                      label="Safety-Critical"
                                      tone="danger"
                                    />
                                  ) : (
                                    <DocumentStatusBadge
                                      label="Not Marked Safety-Critical"
                                      tone="warning"
                                    />
                                  )}
                                </div>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    )}
                  </PlanPreviewSection>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Electronic Signatures
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Required Submission Roles
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Each role is tracked independently with signer identity, role, signature status, and date/time. Signature records are persisted with the submitted planning revision; authenticated user identity and cloud signature storage can be layered onto this workflow as those platform services are connected.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentStatusBadge
                      label={`${submissionSignatureSummary.signed}/${submissionSignatureSummary.total} Signed`}
                      tone={
                        submissionSignatureSummary.total > 0 &&
                        submissionSignatureSummary.signed ===
                          submissionSignatureSummary.total
                          ? "success"
                          : "warning"
                      }
                    />

                    <DocumentStatusBadge
                      label={`${submissionSignatureSummary.pendingRequired} Required Pending`}
                      tone={
                        submissionSignatureSummary.pendingRequired > 0
                          ? "danger"
                          : "success"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {submissionSignatures.map(
                    (signature) => (
                      <SignatureRoleCard
                        key={signature.id}
                        signature={signature}
                        onSign={(signatureDataUrl) =>
                          signSubmissionRole(
                            signature.id,
                            signatureDataUrl,
                          )
                        }
                        onClear={() =>
                          clearSubmissionSignature(
                            signature.id,
                          )
                        }
                        onRemove={
                          signature.id.startsWith(
                            "additional-",
                          )
                            ? () =>
                                removeAdditionalApprover(
                                  signature.id,
                                )
                            : undefined
                        }
                      />
                    ),
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                      Optional Additional Approval
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                      Add another approval role
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                      Use this for an owner representative, contractor safety manager, project manager, buyer, or another project-specific approver. Future versions will load these roles automatically from configured approval routing.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <TextControl
                      label="Approver Role"
                      value={additionalApproverRole}
                      placeholder="Example: Contractor Safety Manager"
                      onChange={setAdditionalApproverRole}
                    />

                    <TextControl
                      label="Approver Name"
                      value={additionalApproverName}
                      placeholder="Enter approver name"
                      onChange={setAdditionalApproverName}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addAdditionalApprover}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(102,87,232,0.22)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)]"
                  >
                    + Add Optional Approver
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                    Review History
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                    Revision Comment Status
                  </h3>

                  <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    Revision comments remain part of the planning history. Resolved comments are preserved so the future audit log can show what was requested and addressed before submission.
                  </p>
                </div>

                {reviewComments.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-4">
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      No review comments were created.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {reviewComments.map(
                      (comment) => (
                        <article
                          key={comment.id}
                          className={`rounded-xl border p-4 ${
                            comment.status === "Open"
                              ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
                              : "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                                {comment.section}
                              </p>

                              <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                {comment.label}
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-xs font-medium leading-5 text-[var(--qoreva-text)]">
                                {comment.comment}
                              </p>
                            </div>

                            <DocumentStatusBadge
                              label={comment.status}
                              tone={
                                comment.status === "Open"
                                  ? "danger"
                                  : "success"
                              }
                            />
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionAcknowledged(
                      (current) => !current,
                    );
                    setStepError("");
                  }}
                  aria-pressed={
                    submissionAcknowledged
                  }
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    submissionAcknowledged
                      ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                      : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] hover:border-[rgba(102,87,232,0.28)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      submissionAcknowledged
                        ? "border-[var(--qoreva-success)] bg-[var(--qoreva-success)] text-white"
                        : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
                    }`}
                  >
                    <CheckIcon />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                      Final submission acknowledgement
                    </span>

                    <span className="mt-1 block text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                      I confirm the required review has been completed, the required signers are the appropriate people, open revision comments have been resolved, and the planning record is ready to enter the configured approval/submission workflow.
                    </span>
                  </span>
                </button>
              </section>

              <section
                className={`rounded-2xl border p-5 ${
                  submitted
                    ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                    : "border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)]"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Final Action
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      {submitted
                        ? "Submission Complete"
                        : "Submit Planning Record"}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      {submitted
                        ? "The guided front-end workflow is complete for this session."
                        : "Required signatures, zero open review comments, and the final acknowledgement are required before submission."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={submitPlanningRecord}
                    disabled={
                      submitted ||
                      submissionSaving
                    }
                    className={`
                      ${primaryButtonClassName}
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    `}
                  >
                    {submissionSaving
                      ? "Submitting Planning Record..."
                      : submitted
                        ? "Planning Record Submitted ✓"
                        : "Submit Planning Record"}
                  </button>
                </div>
              </section>
            </div>
          </section>

          <section
            className="
              flex
              flex-col-reverse
              gap-3
              rounded-[1.75rem]
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              type="button"
              onClick={goBackOneStep}
              disabled={submitted}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              ← Back to Qualified Review
            </button>

            <Link
              href="/planning"
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-5
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-surface-muted)]
              "
            >
              Return to Planning Dashboard
            </Link>
          </section>
        </>
      ) : null}

      {stepError ? (
        <div
          role="alert"
          className="
            rounded-2xl
            border
            border-[#F0BDC4]
            bg-[var(--qoreva-danger-soft)]
            px-4
            py-3
            text-sm
            font-black
            text-[var(--qoreva-danger)]
          "
        >
          {stepError}
        </div>
      ) : null}

      {/* AI notice */}
      <section
        className="
          rounded-[1.75rem]
          border
          border-[rgba(102,87,232,0.16)]
          bg-[var(--qoreva-violet-faint)]
          p-5
          sm:p-6
        "
      >
        <div className="flex items-start gap-4">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[var(--qoreva-violet-soft)]
              font-black
              text-[var(--qoreva-violet-dark)]
            "
          >
            AI
          </div>

          <div>
            <h3
              className="
                font-black
                text-[var(--qoreva-obsidian)]
              "
            >
              Qoreva™ Planning
              Intelligence
            </h3>

            <p
              className="
                mt-1
                max-w-4xl
                text-sm
                font-medium
                leading-6
                text-[var(--qoreva-muted)]
              "
            >
              Qoreva will reference
              applicable owner,
              project, company, and
              contractor safety
              requirements while
              assisting with the
              plan. Qualified people
              remain responsible for
              reviewing and approving
              the final planning
              record.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DynamicPlanningQuestionInput({
  question,
  value,
  onChange,
}: {
  question: DynamicPlanningQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = Array.isArray(question.options)
    ? question.options.filter(
        (option): option is string =>
          typeof option === "string",
      )
    : [];

  if (question.questionType === "Boolean") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`min-h-10 rounded-xl border px-4 py-2 text-xs font-black transition ${
              value === option.value
                ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white"
                : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:bg-[var(--qoreva-violet-faint)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (
    question.questionType === "SingleSelect" &&
    options.length > 0
  ) {
    return (
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-4 ${fieldClassName}`}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.questionType === "TextArea") {
    return (
      <textarea
        value={value}
        rows={3}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Enter the task-specific answer..."
        className={`mt-4 ${textareaClassName}`}
      />
    );
  }

  return (
    <div className="mt-4">
      <input
        type={
          question.questionType === "Number"
            ? "number"
            : question.questionType === "Date"
              ? "date"
              : "text"
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={
          question.questionType === "Person"
            ? "Enter responsible person"
            : question.questionType === "Equipment"
              ? "Enter equipment"
              : "Enter answer"
        }
        className={fieldClassName}
      />

      {question.unit ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--qoreva-subtle)]">
          Unit: {question.unit}
        </p>
      ) : null}
    </div>
  );
}

function formatDynamicAnswer(
  question: DynamicPlanningQuestion,
  value: string,
) {
  if (!value) {
    return "";
  }

  if (question.questionType === "Boolean") {
    return value === "true"
      ? "Yes"
      : value === "false"
        ? "No"
        : value;
  }

  return value;
}

function WizardProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-[1.75rem]
        border
        border-[var(--qoreva-border)]
        bg-white
        shadow-[var(--qoreva-shadow-sm)]
      "
    >
      <div
        className="
          border-b
          border-[var(--qoreva-border)]
          px-5
          py-4
          sm:px-6
        "
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.14em]
                text-[var(--qoreva-violet)]
              "
            >
              Guided Planning
            </p>

            <h2
              className="
                mt-1
                font-black
                text-[var(--qoreva-obsidian)]
              "
            >
              Step {currentStep} of
              8
            </h2>
          </div>

          <span
            className="
              rounded-full
              border
              border-[rgba(102,87,232,0.18)]
              bg-[var(--qoreva-violet-soft)]
              px-3
              py-1
              text-[10px]
              font-black
              uppercase
              tracking-[0.1em]
              text-[var(--qoreva-violet-dark)]
            "
          >
            Draft
          </span>
        </div>
      </div>

      <div
        className="
          overflow-x-auto
          px-4
          py-4
          sm:px-6
        "
      >
        <div
          className="
            flex
            min-w-[850px]
            items-start
            justify-between
          "
        >
          {wizardSteps.map(
            (step, index) => {
              const active =
                step.number ===
                currentStep;

              const complete =
                step.number <
                currentStep;

              return (
                <div
                  key={
                    step.number
                  }
                  className="
                    relative
                    flex
                    flex-1
                    items-start
                  "
                >
                  <div
                    className="
                      relative
                      z-10
                      flex
                      flex-col
                      items-center
                      text-center
                    "
                  >
                    <div
                      className={`
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        border
                        text-xs
                        font-black

                        ${
                          active
                            ? `
                              border-[var(--qoreva-violet)]
                              bg-[var(--qoreva-violet)]
                              text-white
                            `
                            : complete
                              ? `
                                border-[#BDE8D4]
                                bg-[var(--qoreva-success-soft)]
                                text-[var(--qoreva-success)]
                              `
                              : `
                                border-[var(--qoreva-border)]
                                bg-white
                                text-[var(--qoreva-muted)]
                              `
                        }
                      `}
                    >
                      {complete ? (
                        <CheckIcon />
                      ) : (
                        step.number
                      )}
                    </div>

                    <p
                      className={`
                        mt-2
                        max-w-24
                        text-[10px]
                        font-black

                        ${
                          active
                            ? "text-[var(--qoreva-violet-dark)]"
                            : complete
                              ? "text-[var(--qoreva-success)]"
                              : "text-[var(--qoreva-muted)]"
                        }
                      `}
                    >
                      {
                        step.shortTitle
                      }
                    </p>
                  </div>

                  {index <
                  wizardSteps.length -
                    1 ? (
                    <div
                      aria-hidden="true"
                      className={`
                        mt-[17px]
                        h-px
                        flex-1

                        ${
                          complete
                            ? "bg-[#BDE8D4]"
                            : "bg-[var(--qoreva-border)]"
                        }
                      `}
                    />
                  ) : null}
                </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}

function StepHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-[var(--qoreva-obsidian)]
            text-[11px]
            font-black
            text-[#B9B0FF]
          "
        >
          {number}
        </span>

        <div>
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.14em]
              text-[var(--qoreva-violet)]
            "
          >
            {eyebrow}
          </p>

          <h2
            className="
              text-xl
              font-black
              tracking-[-0.025em]
              text-[var(--qoreva-obsidian)]
            "
          >
            {title}
          </h2>
        </div>
      </div>

      <p
        className="
          mt-3
          max-w-3xl
          text-sm
          font-medium
          leading-6
          text-[var(--qoreva-muted)]
        "
      >
        {description}
      </p>
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;

  options: {
    value: string;
    label: string;
  }[];

  disabled?: boolean;

  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-black
          text-[var(--qoreva-text)]
        "
      >
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={`
          ${fieldClassName}
          disabled:cursor-not-allowed
          disabled:bg-[var(--qoreva-surface-muted)]
          disabled:text-[var(--qoreva-subtle)]
        `}
      >
        {options.map(
          (option) => (
            <option
              key={`${label}-${option.value}`}
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function TextControl({
  label,
  value,
  placeholder = "",
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "date" | "number";

  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-black
          text-[var(--qoreva-text)]
        "
      >
        {label}
      </span>

      <input
        type={type}
        min={
          type === "number"
            ? 1
            : undefined
        }
        step={
          type === "number"
            ? 1
            : undefined
        }
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={
          fieldClassName
        }
      />
    </label>
  );
}


function TextareaControl({
  label,
  value,
  placeholder = "",
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-black
          text-[var(--qoreva-text)]
        "
      >
        {label}
      </span>

      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={textareaClassName}
      />
    </label>
  );
}

function TextareaCard({
  eyebrow,
  title,
  description,
  value,
  placeholder,
  onChange,
}: {
  eyebrow: string;
  title: string;
  description: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
        {title}
      </h3>

      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
        {description}
      </p>

      <textarea
        value={value}
        rows={5}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-4 ${textareaClassName}`}
      />
    </article>
  );
}

function ContextCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;

  items: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <article
      className="
        rounded-2xl
        border
        border-[var(--qoreva-border)]
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
      "
    >
      <p
        className="
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          text-[var(--qoreva-violet)]
        "
      >
        {eyebrow}
      </p>

      <h3
        className="
          mt-1
          text-lg
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {title}
      </h3>

      <div
        className="
          mt-4
          grid
          gap-3
          sm:grid-cols-2
        "
      >
        {items.map(
          (item) => (
            <div
              key={`${eyebrow}-${item.label}`}
              className="
                rounded-xl
                border
                border-[var(--qoreva-border)]
                bg-[var(--qoreva-surface-muted)]
                p-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-[var(--qoreva-muted)]
                "
              >
                {
                  item.label
                }
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                {
                  item.value
                }
              </p>
            </div>
          ),
        )}
      </div>
    </article>
  );
}


function StepMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClasses = {
    success: {
      border: "border-[#BDE8D4]",
      value: "text-[var(--qoreva-success)]",
    },
    warning: {
      border: "border-[#F0D5A4]",
      value: "text-[#9B6212]",
    },
    danger: {
      border: "border-[#F0BDC4]",
      value: "text-[var(--qoreva-danger)]",
    },
    neutral: {
      border: "border-[var(--qoreva-border)]",
      value: "text-[var(--qoreva-obsidian)]",
    },
  } as const;

  const classes = toneClasses[tone];

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-[var(--qoreva-shadow-sm)] ${classes.border}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>

      <p className={`mt-2 text-3xl font-black tracking-[-0.04em] ${classes.value}`}>
        {value}
      </p>

      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
        {detail}
      </p>
    </div>
  );
}

function RequirementRow({
  requirement,
}: {
  requirement: PlanningRequirement;
}) {
  const status =
    requirement.status.hasApprovedDocument
      ? {
          label: "Approved Match",
          className:
            "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",
        }
      : requirement.status.hasCurrentDocument
        ? {
            label: "Review Needed",
            className:
              "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",
          }
        : requirement.status.hasDocument
          ? {
              label: "Document Issue",
              className:
                "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",
            }
          : {
              label: "Missing",
              className:
                "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",
            };

  return (
    <article className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-[var(--qoreva-obsidian)]">
              {requirement.name}
            </h4>

            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                requirement.isRequired
                  ? "border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]"
                  : "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-muted)]"
              }`}
            >
              {requirement.isRequired ? "Required" : "Optional"}
            </span>
          </div>

          <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
            {requirement.documentType}
          </p>

          {requirement.description ? (
            <p className="mt-2 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
              {requirement.description}
            </p>
          ) : null}
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </article>
  );
}

function PlanningDocumentCard({
  document,
  selected,
  onToggle,
}: {
  document: PlanningDocument;
  selected: boolean;
  onToggle: () => void;
}) {
  const rejected =
    document.approvalStatus.toLowerCase() === "rejected" ||
    document.reviewStatus.toLowerCase() === "rejected";

  const disabled =
    rejected || document.planningStatus.isExpired;

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        selected
          ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)] ring-4 ring-[rgba(102,87,232,0.06)]"
          : "border-[var(--qoreva-border)] bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={onToggle}
            aria-pressed={selected}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
              selected
                ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white"
                : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <CheckIcon />
          </button>

          <div className="min-w-0">
            <p className="break-words font-black text-[var(--qoreva-obsidian)]">
              {document.documentName}
            </p>

            <p className="mt-1 break-words text-xs font-medium text-[var(--qoreva-muted)]">
              {document.fileName}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <DocumentStatusBadge
                label={document.documentType}
                tone="info"
              />

              <DocumentStatusBadge
                label={`Approval: ${document.approvalStatus}`}
                tone={statusTone(document.approvalStatus)}
              />

              <DocumentStatusBadge
                label={`Review: ${document.reviewStatus}`}
                tone={statusTone(document.reviewStatus)}
              />

              <DocumentStatusBadge
                label={
                  document.planningStatus.isAiReady
                    ? "AI Ready"
                    : `AI: ${document.aiProcessingStatus}`
                }
                tone={
                  document.planningStatus.isAiReady
                    ? "success"
                    : "neutral"
                }
              />

              {document.planningStatus.isExpired ? (
                <DocumentStatusBadge
                  label="Expired"
                  tone="danger"
                />
              ) : null}

              {document.planningStatus.recommendedForAi ? (
                <DocumentStatusBadge
                  label="Recommended Source"
                  tone="success"
                />
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-xs font-medium text-[var(--qoreva-muted)] sm:grid-cols-2">
              <p>
                Expires:{" "}
                <span className="font-black text-[var(--qoreva-text)]">
                  {formatNullableDate(document.expirationDate)}
                </span>
              </p>

              <p>
                Size:{" "}
                <span className="font-black text-[var(--qoreva-text)]">
                  {formatFileSize(document.fileSize)}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:max-w-xs">
          {disabled ? (
            <p className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-3 py-2 text-xs font-black leading-5 text-[var(--qoreva-danger)]">
              {document.planningStatus.isExpired
                ? "Expired documents cannot be selected as an active planning source."
                : "Rejected documents cannot be selected as an active planning source."}
            </p>
          ) : !document.planningStatus.isAiReady ? (
            <p className="rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-3 py-2 text-xs font-black leading-5 text-[#9B6212]">
              This document may be selected for context, but AI processing is not complete.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function DocumentStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const classes = {
    success:
      "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",
    warning:
      "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",
    danger:
      "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",
    info:
      "border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",
    neutral:
      "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]",
  } as const;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${classes[tone]}`}>
      {label}
    </span>
  );
}

function statusTone(
  value: string,
): "success" | "warning" | "danger" | "neutral" {
  const normalized = value.trim().toLowerCase();

  if (
    ["approved", "reviewed", "complete", "completed", "current"].includes(
      normalized,
    )
  ) {
    return "success";
  }

  if (
    ["rejected", "expired", "denied"].includes(normalized)
  ) {
    return "danger";
  }

  if (
    [
      "pending",
      "needs revision",
      "revision needed",
      "not reviewed",
      "action required",
    ].includes(normalized)
  ) {
    return "warning";
  }

  return "neutral";
}

function formatNullableDate(
  value: string | null,
): string {
  if (!value) {
    return "No expiration";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${
    units[unitIndex]
  }`;
}





function SignatureRoleCard({
  signature,
  onSign,
  onClear,
  onRemove,
}: {
  signature: SubmissionSignature;
  onSign: (signatureDataUrl: string) => void;
  onClear: () => void;
  onRemove?: () => void;
}) {
  const signed =
    signature.status === "Signed";

  const [signatureOpen, setSignatureOpen] =
    useState(false);

  return (
    <>
      <article
        className={`rounded-2xl border p-4 ${
          signed
            ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
            : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                {signature.role}
              </p>

              <DocumentStatusBadge
                label={
                  signature.required
                    ? "Required"
                    : "Optional"
                }
                tone={
                  signature.required
                    ? "info"
                    : "neutral"
                }
              />

              <DocumentStatusBadge
                label={signature.status}
                tone={
                  signed
                    ? "success"
                    : "warning"
                }
              />
            </div>

            <p className="mt-2 text-sm font-medium text-[var(--qoreva-text)]">
              {signature.signerName ||
                "Signer not identified"}
            </p>

            {signed &&
            signature.signatureDataUrl ? (
              <div className="mt-3 max-w-sm rounded-xl border border-[#BDE8D4] bg-white p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--qoreva-muted)]">
                  Captured Signature
                </p>
                <img
                  src={signature.signatureDataUrl}
                  alt={`Signature for ${signature.signerName || signature.role}`}
                  className="h-20 w-full object-contain object-left"
                />
              </div>
            ) : null}

            <p className="mt-2 text-xs font-medium text-[var(--qoreva-muted)]">
              {signed && signature.signedAt
                ? `Signed ${formatDateTime(
                    signature.signedAt,
                  )}`
                : "Awaiting handwritten signature"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {signed ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg border border-[#F0D5A4] bg-white px-3 py-2 text-xs font-black text-[#9B6212] transition hover:bg-[var(--qoreva-warning-soft)]"
              >
                Clear Signature
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setSignatureOpen(true)
                }
                disabled={!signature.signerName.trim()}
                className="rounded-lg border border-[#BDE8D4] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-success)] transition hover:bg-[var(--qoreva-success-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Draw Signature
              </button>
            )}

            {onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="rounded-lg border border-[#F0BDC4] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)]"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {signatureOpen ? (
        <SignaturePadModal
          signerName={signature.signerName}
          signerRole={signature.role}
          onCancel={() =>
            setSignatureOpen(false)
          }
          onAccept={(signatureDataUrl) => {
            onSign(signatureDataUrl);
            setSignatureOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function SignaturePadModal({
  signerName,
  signerRole,
  onCancel,
  onAccept,
}: {
  signerName: string;
  signerRole: string;
  onCancel: () => void;
  onAccept: (signatureDataUrl: string) => void;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);

  const [hasInk, setHasInk] =
    useState(false);
  const [
    identityAcknowledged,
    setIdentityAcknowledged,
  ] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const rect =
        canvas.getBoundingClientRect();
      const ratio =
        window.devicePixelRatio || 1;

      canvas.width =
        Math.max(1, Math.floor(rect.width * ratio));
      canvas.height =
        Math.max(1, Math.floor(rect.height * ratio));

      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0,
      );
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.25;
      context.strokeStyle = "#172033";
    };

    resizeCanvas();
  }, []);

  function getPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function beginDrawing(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;
    const context =
      canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(
      event.pointerId,
    );

    const point = getPoint(event);
    drawingRef.current = true;

    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context =
      canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    event.preventDefault();

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();

    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  }

  function endDrawing(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (
      canvas?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      canvas.releasePointerCapture(
        event.pointerId,
      );
    }

    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context =
      canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    hasInkRef.current = false;
    setHasInk(false);
    setIdentityAcknowledged(false);
  }

  function acceptSignature() {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      !hasInk ||
      !identityAcknowledged
    ) {
      return;
    }

    onAccept(
      canvas.toDataURL("image/png"),
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-pad-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--qoreva-border)] bg-white shadow-2xl">
        <div className="border-b border-[var(--qoreva-border)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-primary)]">
                Electronic Signature
              </p>
              <h3
                id="signature-pad-title"
                className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]"
              >
                Draw Your Signature
              </h3>
              <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                {signerName || "Signer"} ·{" "}
                {signerRole}
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[var(--qoreva-border)] px-3 py-2 text-xs font-black text-[var(--qoreva-text)] hover:bg-[var(--qoreva-surface-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-3 text-sm font-semibold text-[var(--qoreva-text)]">
            Use your finger, stylus, or mouse to sign inside the box.
          </p>

          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-[var(--qoreva-border-strong)] bg-white">
            <canvas
              ref={canvasRef}
              className="block h-56 w-full touch-none cursor-crosshair"
              onPointerDown={beginDrawing}
              onPointerMove={draw}
              onPointerUp={endDrawing}
              onPointerCancel={endDrawing}
              onPointerLeave={(event) => {
                if (
                  event.buttons === 0
                ) {
                  endDrawing(event);
                }
              }}
            />
            <div className="border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-2">
              <div className="h-px bg-[var(--qoreva-border-strong)]" />
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qoreva-muted)]">
                Sign above
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearCanvas}
              disabled={!hasInk}
              className="rounded-lg border border-[var(--qoreva-border)] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-text)] disabled:opacity-40"
            >
              Clear Drawing
            </button>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <input
              type="checkbox"
              checked={
                identityAcknowledged
              }
              onChange={(event) =>
                setIdentityAcknowledged(
                  event.target.checked,
                )
              }
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-sm font-semibold leading-5 text-[var(--qoreva-text)]">
              I confirm that I am{" "}
              <strong>
                {signerName || "the identified signer"}
              </strong>{" "}
              and that this electronic signature represents my approval of this planning record.
            </span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[var(--qoreva-border)] bg-white px-5 py-3 text-sm font-black text-[var(--qoreva-text)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={acceptSignature}
              disabled={
                !hasInk ||
                !identityAcknowledged
              }
              className="
                inline-flex
                min-h-11
                min-w-40
                items-center
                justify-center
                rounded-xl
                bg-[var(--qoreva-violet)]
                px-5
                py-3
                text-sm
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-[var(--qoreva-violet-dark)]
                disabled:cursor-not-allowed
                disabled:bg-[var(--qoreva-violet-soft)]
                disabled:text-[var(--qoreva-violet-dark)]
                disabled:opacity-70
              "
            >
              Accept Signature
            </button>
          </div>

          <p className="mt-4 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
            The signature is captured for this planning revision and is persisted with the submission record. Authenticated user identity, cloud signature storage, and additional device verification can be layered onto this workflow as Qoreva authentication is connected.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewCommentComposer({
  targetId,
  section,
  label,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
  onCancelComment,
}: {
  targetId: string;
  section: string;
  label: string;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: (input: {
    targetId: string;
    section: string;
    label: string;
  }) => void;
  onCancelComment: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
        Request Revision
      </p>

      <textarea
        value={commentDraft}
        rows={3}
        placeholder="Explain exactly what needs to be corrected or clarified..."
        onChange={(event) =>
          onCommentDraftChange(
            event.target.value,
          )
        }
        className={`mt-2 ${textareaClassName}`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onAddComment({
              targetId,
              section,
              label,
            })
          }
          className="rounded-lg bg-[var(--qoreva-danger)] px-3 py-2 text-xs font-black text-white transition hover:opacity-90"
        >
          Add Revision Comment
        </button>

        <button
          type="button"
          onClick={onCancelComment}
          className="rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReviewablePreviewField({
  targetId,
  section,
  label,
  value,
  activeTargetId,
  commentDraft,
  onOpenComment,
  onCommentDraftChange,
  onAddComment,
  onCancelComment,
}: {
  targetId: string;
  section: string;
  label: string;
  value: string;
  activeTargetId: string | null;
  commentDraft: string;
  onOpenComment: (targetId: string) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: (input: {
    targetId: string;
    section: string;
    label: string;
  }) => void;
  onCancelComment: () => void;
}) {
  return (
    <div
      id={targetId}
      className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-black text-[var(--qoreva-obsidian)]">
            {value}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenComment(targetId)
          }
          className="shrink-0 rounded-lg border border-[#F0BDC4] bg-white px-2.5 py-1.5 text-[10px] font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)]"
        >
          Request Revision
        </button>
      </div>

      {activeTargetId === targetId ? (
        <ReviewCommentComposer
          targetId={targetId}
          section={section}
          label={label}
          commentDraft={commentDraft}
          onCommentDraftChange={
            onCommentDraftChange
          }
          onAddComment={onAddComment}
          onCancelComment={
            onCancelComment
          }
        />
      ) : null}
    </div>
  );
}

function ReviewableTextBlock({
  targetId,
  section,
  label,
  value,
  activeTargetId,
  commentDraft,
  onOpenComment,
  onCommentDraftChange,
  onAddComment,
  onCancelComment,
}: {
  targetId: string;
  section: string;
  label: string;
  value: string;
  activeTargetId: string | null;
  commentDraft: string;
  onOpenComment: (targetId: string) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: (input: {
    targetId: string;
    section: string;
    label: string;
  }) => void;
  onCancelComment: () => void;
}) {
  return (
    <div
      id={targetId}
      className="rounded-xl border border-[var(--qoreva-border)] bg-white p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
            {label}
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--qoreva-text)]">
            {value}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenComment(targetId)
          }
          className="shrink-0 rounded-lg border border-[#F0BDC4] bg-white px-2.5 py-1.5 text-[10px] font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)]"
        >
          Request Revision
        </button>
      </div>

      {activeTargetId === targetId ? (
        <ReviewCommentComposer
          targetId={targetId}
          section={section}
          label={label}
          commentDraft={commentDraft}
          onCommentDraftChange={
            onCommentDraftChange
          }
          onAddComment={onAddComment}
          onCancelComment={
            onCancelComment
          }
        />
      ) : null}
    </div>
  );
}

function ReviewableRiskBadge({
  targetId,
  section,
  label,
  riskLevel,
  activeTargetId,
  commentDraft,
  onOpenComment,
  onCommentDraftChange,
  onAddComment,
  onCancelComment,
}: {
  targetId: string;
  section: string;
  label: string;
  riskLevel:
    | "Low"
    | "Medium"
    | "High"
    | "";
  activeTargetId: string | null;
  commentDraft: string;
  onOpenComment: (targetId: string) => void;
  onCommentDraftChange: (value: string) => void;
  onAddComment: (input: {
    targetId: string;
    section: string;
    label: string;
  }) => void;
  onCancelComment: () => void;
}) {
  return (
    <div
      id={targetId}
      className="rounded-xl transition-all"
    >
      <div className="flex flex-wrap items-center gap-2">
        <RiskLevelBadge
          riskLevel={riskLevel}
        />

        <button
          type="button"
          onClick={() =>
            onOpenComment(targetId)
          }
          className="rounded-lg border border-[#F0BDC4] bg-white px-2.5 py-1.5 text-[10px] font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)]"
        >
          Request Revision
        </button>
      </div>

      {activeTargetId === targetId ? (
        <ReviewCommentComposer
          targetId={targetId}
          section={section}
          label={label}
          commentDraft={commentDraft}
          onCommentDraftChange={
            onCommentDraftChange
          }
          onAddComment={onAddComment}
          onCancelComment={
            onCancelComment
          }
        />
      ) : null}
    </div>
  );
}

function ReviewCommentRow({
  comment,
  onJump,
  onResolve,
  onReopen,
}: {
  comment: ReviewComment;
  onJump: () => void;
  onResolve: () => void;
  onReopen: () => void;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        comment.status === "Open"
          ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
          : "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
              {comment.section}
            </p>

            <DocumentStatusBadge
              label={comment.status}
              tone={
                comment.status === "Open"
                  ? "danger"
                  : "success"
              }
            />
          </div>

          <h4 className="mt-1 font-black text-[var(--qoreva-obsidian)]">
            {comment.label}
          </h4>

          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--qoreva-text)]">
            {comment.comment}
          </p>

          <p className="mt-2 text-[10px] font-bold text-[var(--qoreva-muted)]">
            {comment.createdBy} •{" "}
            {formatDateTime(
              comment.createdAt,
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onJump}
            className="rounded-lg border border-[rgba(102,87,232,0.22)] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)]"
          >
            Go to Issue
          </button>

          {comment.status === "Open" ? (
            <button
              type="button"
              onClick={onResolve}
              className="rounded-lg border border-[#BDE8D4] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-success)] transition hover:bg-[var(--qoreva-success-soft)]"
            >
              Resolve
            </button>
          ) : (
            <button
              type="button"
              onClick={onReopen}
              className="rounded-lg border border-[#F0D5A4] bg-white px-3 py-2 text-xs font-black text-[#9B6212] transition hover:bg-[var(--qoreva-warning-soft)]"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function ReviewEditButton({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 text-left transition hover:-translate-y-px hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-faint)]"
    >
      <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
        {detail}
      </p>

      <p className="mt-3 text-xs font-black text-[var(--qoreva-violet-dark)]">
        Edit section →
      </p>
    </button>
  );
}

function ReviewConfirmation({
  checked,
  title,
  detail,
  onClick,
}: {
  checked: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        checked
          ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
          : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] hover:border-[rgba(102,87,232,0.28)]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          checked
            ? "border-[var(--qoreva-success)] bg-[var(--qoreva-success)] text-white"
            : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
        }`}
      >
        <CheckIcon />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
          {title}
        </span>

        <span className="mt-1 block text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
          {detail}
        </span>
      </span>
    </button>
  );
}

function QualityCheckRow({
  check,
}: {
  check: PlanningQualityCheck;
}) {
  const tone =
    check.status === "Pass"
      ? "success"
      : check.status === "Warning"
        ? "warning"
        : "danger";

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h4 className="text-sm font-black text-[var(--qoreva-obsidian)]">
          {check.title}
        </h4>

        <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
          {check.detail}
        </p>
      </div>

      <DocumentStatusBadge
        label={check.status}
        tone={tone}
      />
    </article>
  );
}

function PlanPreviewSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="border-b border-[var(--qoreva-border)] pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
          {title}
        </h3>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[var(--qoreva-obsidian)]">
        {value}
      </p>
    </div>
  );
}

function PreviewTextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--qoreva-border)] bg-white p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--qoreva-text)]">
        {value}
      </p>
    </div>
  );
}

function RiskLevelBadge({
  riskLevel,
}: {
  riskLevel:
    | "Low"
    | "Medium"
    | "High"
    | "";
}) {
  if (!riskLevel) {
    return (
      <DocumentStatusBadge
        label="Risk: Needs Input"
        tone="danger"
      />
    );
  }

  return (
    <DocumentStatusBadge
      label={`Risk: ${riskLevel}`}
      tone={
        riskLevel === "Low"
          ? "success"
          : riskLevel === "Medium"
            ? "warning"
            : "danger"
      }
    />
  );
}

function toDateInputValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function formatSimpleDate(
  value: string,
): string {
  const date = new Date(
    `${value}T12:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function EmptySelection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--qoreva-border)]
        bg-white
        px-6
        py-12
        text-center
      "
    >
      <p
        className="
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-medium
          text-[var(--qoreva-muted)]
        "
      >
        {description}
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3 w-3"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 1 1 1.408-1.408L8.5 12.086l6.796-6.79a1 1 0 0 1 1.408 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const primaryButtonClassName = `
  inline-flex
  min-h-12
  items-center
  justify-center
  rounded-xl
  bg-[var(--qoreva-violet)]
  px-6
  py-3
  text-sm
  font-black
  text-white
  shadow-sm
  transition-all

  hover:-translate-y-px
  hover:bg-[var(--qoreva-violet-hover)]
  hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
`;

const fieldClassName = `
  h-11
  w-full
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  text-sm
  font-semibold
  text-[var(--qoreva-text)]
  outline-none
  transition-all

  placeholder:text-[var(--qoreva-subtle)]

  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]
`;

const textareaClassName = `
  w-full
  resize-y
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  py-3
  text-sm
  font-semibold
  leading-6
  text-[var(--qoreva-text)]
  outline-none
  transition-all

  placeholder:text-[var(--qoreva-subtle)]

  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]
`;