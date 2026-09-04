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

type PersistedPlanningSourceDocument = {
  id: string;
  planningRecordId: string;
  contractorDocumentId: string | null;
  sourceType: string;
  label: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  storageProvider: string | null;
  storageKey: string | null;
  storageUrl: string | null;
  isSelected: boolean;
  isAiReady: boolean;
  approvalStatusAtSelection: string | null;
  reviewStatusAtSelection: string | null;
  createdAt: string;
  updatedAt: string;
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

type GuidedPlanningActivitiesResponse = {
  planningRecordId?: string;
  activities?: Array<{
    activityCode: string;
    name: string;
    category: string | null;
    detectionSource: string | null;
    score: number;
  }>;
  count?: number;
  message?: string;
};

type RequirementQuestionSource = {
  requirementRuleId: string;
  ruleCode: string;
  title: string;
  requirementText: string;
  purpose: string;
  severity: string | null;

  requirementPackId: string;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;
  version: number;

  sourceDocumentName: string | null;
  sourcePage: string | null;
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

  requirementSources: RequirementQuestionSource[];
};

type PlanningComplianceResult = {
  requirementRuleId: string;
  requirementRuleCode: string;
  requirementTitle: string;

  requirementPackId: string;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;

  questionDefinitionId: string;
  questionCode: string;
  questionText: string;

  purpose: string;

  status:
    | "Satisfied"
    | "Unresolved"
    | "NotEvaluated";

  blockingLevel: string | null;
  message: string | null;

  validationType: string | null;
  expectedValue: string | null;
  actualValue: string | null;
};

type PlanningComplianceEvaluation = {
  results: PlanningComplianceResult[];

  summary: {
    total: number;
    satisfied: number;
    unresolved: number;
    notEvaluated: number;
    submissionBlocking: number;
    approvalBlocking: number;
  };
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

type GeneratedHazardControlItem = {
  id: string;
  text: string;

  source:
    | "User"
    | "Rule"
    | "Requirement"
    | "AI";

  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];

  required: boolean;
};

type GeneratedHazardControlGroup = {
  id: string;
  hazard: GeneratedHazardControlItem;
  controls: GeneratedHazardControlItem[];
};

type HazardCategory =
  | "Electrical"
  | "LOTO / Stored Energy"
  | "Work at Height"
  | "Excavation / Trenching"
  | "Confined Space"
  | "Lifting / Rigging"
  | "Mobile Equipment / Traffic"
  | "Hot Work / Fire"
  | "Chemical Exposure"
  | "Dust / Airborne Exposure"
  | "Noise"
  | "Struck-By / Line of Fire"
  | "Caught-In / Between"
  | "Material Handling / Ergonomics"
  | "Slip / Trip / Walking Surface"
  | "General Hazard";

type HazardPresentation = {
  category: HazardCategory;
};

type HazardIconProps = {
  category: HazardCategory;
  className?: string;
};

function HazardIcon({
  category,
  className = "h-5 w-5",
}: HazardIconProps) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (category) {
    case "Electrical":
      return (
        <svg {...commonProps}>
          <path d="M13 2 5.5 13h6L11 22l7.5-12H13L13 2Z" />
        </svg>
      );

    case "LOTO / Stored Energy":
      return (
        <svg {...commonProps}>
          <rect
            x="5"
            y="10"
            width="14"
            height="11"
            rx="2"
          />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </svg>
      );

    case "Work at Height":
      return (
        <svg {...commonProps}>
          <path d="M7 21V5" />
          <path d="M17 21V5" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h10" />
          <path d="m3 4 2-2 2 2" />
        </svg>
      );

    case "Excavation / Trenching":
      return (
        <svg {...commonProps}>
          <path d="M3 18h18" />
          <path d="m4 18 4-7 4 7" />
          <path d="m12 18 4-10 4 10" />
          <path d="M15 5 18 2" />
        </svg>
      );

    case "Confined Space":
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="3"
            width="16"
            height="18"
            rx="2"
          />
          <circle
            cx="12"
            cy="9"
            r="2"
          />
          <path d="M8.5 17c.8-2.6 2-4 3.5-4s2.7 1.4 3.5 4" />
        </svg>
      );

    case "Lifting / Rigging":
      return (
        <svg {...commonProps}>
          <path d="M12 3v7" />
          <path d="M8 7l4-4 4 4" />
          <path d="M6 11h12" />
          <path d="M8 11v4" />
          <path d="M16 11v4" />
          <rect
            x="7"
            y="15"
            width="10"
            height="6"
            rx="1"
          />
        </svg>
      );

    case "Mobile Equipment / Traffic":
      return (
        <svg {...commonProps}>
          <path d="M4 16V9h11l3 4v3" />
          <path d="M15 9V6h3" />
          <circle
            cx="7"
            cy="18"
            r="2"
          />
          <circle
            cx="17"
            cy="18"
            r="2"
          />
          <path d="M9 18h6" />
        </svg>
      );

    case "Hot Work / Fire":
      return (
        <svg {...commonProps}>
          <path d="M12 22c4 0 7-3 7-7 0-3-1.8-5.4-5-8 .2 2-1 3.5-2 4.5C11 9 9 6.5 7 5c0 4-2 5.5-2 9.5C5 19 8 22 12 22Z" />
          <path d="M12 18c1.5 0 2.5-1 2.5-2.4 0-1.1-.6-2-1.7-3-.1 1-.6 1.4-1.1 1.9-.4-1-1.2-2-2-2.6 0 1.6-.7 2.3-.7 3.6C9 17 10.2 18 12 18Z" />
        </svg>
      );

    case "Chemical Exposure":
      return (
        <svg {...commonProps}>
          <path d="M9 3h6" />
          <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
          <path d="M8 15h8" />
          <circle
            cx="9"
            cy="18"
            r=".7"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="14"
            cy="17"
            r=".7"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    case "Dust / Airborne Exposure":
      return (
        <svg {...commonProps}>
          <path d="M3 8c3-2 5 2 8 0s5 2 8 0" />
          <path d="M5 13c2-1.5 4 1.5 6 0s4 1.5 6 0" />
          <path d="M8 18c1.5-1 3 1 4.5 0s3 1 4.5 0" />
        </svg>
      );

    case "Noise":
      return (
        <svg {...commonProps}>
          <path d="M5 10v4" />
          <path d="M8 8v8" />
          <path d="M11 6v12" />
          <path d="M15 8c2 1 2 7 0 8" />
          <path d="M18 5c4 3 4 11 0 14" />
        </svg>
      );

    case "Struck-By / Line of Fire":
      return (
        <svg {...commonProps}>
          <path d="M3 12h14" />
          <path d="m13 7 5 5-5 5" />
          <circle
            cx="20"
            cy="12"
            r="1.5"
          />
        </svg>
      );

    case "Caught-In / Between":
      return (
        <svg {...commonProps}>
          <path d="M3 6h6v12H3" />
          <path d="M21 6h-6v12h6" />
          <path d="m10 9 2 3-2 3" />
          <path d="m14 9-2 3 2 3" />
        </svg>
      );

    case "Material Handling / Ergonomics":
      return (
        <svg {...commonProps}>
          <rect
            x="8"
            y="4"
            width="8"
            height="7"
            rx="1"
          />
          <path d="M5 20v-4c0-2 1-3 3-3h8c2 0 3 1 3 3v4" />
          <path d="M9 13v4" />
          <path d="M15 13v4" />
        </svg>
      );

    case "Slip / Trip / Walking Surface":
      return (
        <svg {...commonProps}>
          <circle
            cx="9"
            cy="5"
            r="2"
          />
          <path d="m8 8 3 3 3-1" />
          <path d="m11 11-2 4" />
          <path d="m11 11 4 4" />
          <path d="M3 20h18" />
          <path d="m15 18 3 2" />
        </svg>
      );

    case "General Hazard":
    default:
      return (
        <svg {...commonProps}>
          <path d="M10.3 3.6 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
}

function includesAnyHazardTerm(
  value: string,
  terms: readonly string[],
) {
  return terms.some((term) =>
    value.includes(term),
  );
}

function getHazardPresentation(
  hazardText: string,
  activityCodes: string[] = [],
): HazardPresentation {
  const normalized = [
    hazardText,
    ...activityCodes,
  ]
    .join(" ")
    .replaceAll("_", " ")
    .toLowerCase();

  if (
    includesAnyHazardTerm(normalized, [
      "confined space",
      "permit space",
      "atmospheric",
      "oxygen deficient",
    ])
  ) {
    return {
      category: "Confined Space",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "excavat",
      "trench",
      "cave-in",
      "underground utility",
      "soil",
    ])
  ) {
    return {
      category: "Excavation / Trenching",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "rigging",
      "suspended load",
      "crane",
      "hoist",
      "lifting",
      "load swing",
    ])
  ) {
    return {
      category: "Lifting / Rigging",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "fall from",
      "work at height",
      "elevated work",
      "ladder",
      "scaffold",
      "roof edge",
      "fall protection",
      "aerial lift",
      "mewp",
    ])
  ) {
    return {
      category: "Work at Height",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "mobile equipment",
      "traffic",
      "vehicle",
      "forklift",
      "skid steer",
      "dozer",
      "excavator",
      "loader",
      "backing",
      "blind spot",
    ])
  ) {
    return {
      category: "Mobile Equipment / Traffic",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "lockout",
      "tagout",
      "loto",
      "stored energy",
      "zero energy",
      "energy isolation",
      "pressure release",
      "hydraulic energy",
      "pneumatic energy",
    ])
  ) {
    return {
      category: "LOTO / Stored Energy",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "electrical",
      "electric shock",
      "arc flash",
      "arc-flash",
      "voltage",
      "energized conductor",
      "electrocution",
    ])
  ) {
    return {
      category: "Electrical",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "hot work",
      "welding",
      "cutting",
      "grinding spark",
      "open flame",
      "fire",
      "ignition",
    ])
  ) {
    return {
      category: "Hot Work / Fire",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "chemical",
      "corrosive",
      "solvent",
      "acid",
      "caustic",
      "sds",
      "vapors",
      "fumes",
      "skin exposure",
    ])
  ) {
    return {
      category: "Chemical Exposure",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "silica",
      "dust",
      "airborne",
      "respiratory",
      "particulate",
    ])
  ) {
    return {
      category: "Dust / Airborne Exposure",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "noise",
      "hearing",
      "sound level",
      "decibel",
    ])
  ) {
    return {
      category: "Noise",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "caught between",
      "caught-between",
      "caught in",
      "caught-in",
      "pinch point",
      "crush point",
      "entanglement",
    ])
  ) {
    return {
      category: "Caught-In / Between",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "struck by",
      "struck-by",
      "line of fire",
      "flying object",
      "falling object",
      "swing radius",
      "projectile",
    ])
  ) {
    return {
      category: "Struck-By / Line of Fire",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "manual handling",
      "material handling",
      "ergonomic",
      "overexertion",
      "lifting material",
      "awkward posture",
    ])
  ) {
    return {
      category: "Material Handling / Ergonomics",
    };
  }

  if (
    includesAnyHazardTerm(normalized, [
      "slip",
      "trip",
      "walking surface",
      "uneven surface",
      "housekeeping",
    ])
  ) {
    return {
      category: "Slip / Trip / Walking Surface",
    };
  }

  return {
    category: "General Hazard",
  };
}


type GeneratedDraftWorkStep = {
  sequence: number;
  title: string;
  description: string | null;

  suggestedHazards: string[];
  suggestedControls: string[];

  /**
   * Qoreva Work-Step Intelligence.
   *
   * New draft generations provide explicit hazard-to-control
   * relationships. This remains optional in the browser type so
   * older persisted revision snapshots can still be opened safely.
   */
  hazardControlGroups?: GeneratedHazardControlGroup[];

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

type HazardControlDecisionValue =
  | "Assign"
  | "Accept"
  | "Modify"
  | "NotApplicable";

type HazardControlDecision = {
  id: string;
  recommendationId: string;
  itemType: "Hazard" | "Control";
  originalText: string;
  decision: HazardControlDecisionValue;
  modifiedText: string | null;
  targetHazardId: string | null;
  canonicalHazardConceptId: string | null;
  sourceType: string | null;
  sourceMetadata: unknown;
  decidedById: string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
};

type HazardControlOverrideAction =
  | "Add"
  | "Edit"
  | "Change"
  | "Remove";

type HazardControlOverride = {
  id: string;
  revisionNumber: number;
  operationKey: string;
  workStepId: string;
  workStepSequence: number | null;
  workStepTitle: string | null;
  itemType: "Hazard" | "Control";
  action: HazardControlOverrideAction;
  targetItemId: string | null;
  parentHazardId: string | null;
  originalText: string | null;
  finalText: string | null;
  canonicalHazardConceptId: string | null;
  sourceType: string | null;
  sourceMetadata: unknown;
  reason: string | null;
  changedById: string | null;
  changedByName: string | null;
  changedByRole: string | null;
  changedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

type HazardEditMode =
  | "Add"
  | "Edit"
  | "Change";

type HazardEditorState = {
  operationKey: string;
  mode: HazardEditMode;
  stepSequence: number;
  stepTitle: string;
  workStepId: string;
  groupId: string | null;
  hazardId: string | null;
  originalText: string | null;
  sourceType: string | null;
  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
  required: boolean;
};

type ControlEditMode =
  | "Add"
  | "Edit";

type RemovedHazardUndoState = {
  operationKey: string;
  stepSequence: number;
  stepTitle: string;
  workStepId: string;
  hazardId: string;
  hazardText: string;
  sourceType: string | null;
  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
  required: boolean;
  reason: string | null;
};

type ControlEditorState = {
  operationKey: string;
  mode: ControlEditMode;
  stepSequence: number;
  stepTitle: string;
  workStepId: string;
  parentHazardId: string;
  parentHazardText: string;
  controlId: string | null;
  originalText: string | null;
  sourceType: string | null;
  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
  required: boolean;
};

type RecommendedControlSuggestion = {
  id: string;
  text: string;
  source: "User" | "Rule" | "Requirement" | "AI";
  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
  required: boolean;
  canonicalHazardConceptId: string;
  canonicalHazardLabel: string;
  riskAttention: "Normal" | "Elevated" | "HighAttention";
  recommendationReason: string;
};

type RecommendedControlsResponse = {
  planningRecordId?: string;
  revisionNumber?: number;
  match?: {
    canonicalHazardConceptId: string;
    label: string;
    kind: string;
    riskAttention: "Normal" | "Elevated" | "HighAttention";
    score: number;
    matchedAlias: string | null;
  } | null;
  recommendations?: RecommendedControlSuggestion[];
  guidance?: string;
  metadata?: {
    recommendationEngineVersion: string;
    recommendationSource: string;
    advisoryOnly: boolean;
    requiresQualifiedUserSelection: boolean;
  };
  message?: string;
};

type ActiveRecommendedControlsState = {
  key: string;
  stepSequence: number;
  stepTitle: string;
  workStepId: string;
  hazardId: string;
  hazardText: string;
  response: RecommendedControlsResponse;
};

type HazardResolutionOption = {
  id: string;
  label: string;
  hazardText: string;
};

const materialHandlingResolutionOptions:
  HazardResolutionOption[] = [
    {
      id: "pinch-crush",
      label:
        "Pinch / crush / hand injuries",
      hazardText:
        "Crushing or pinch-point exposure",
    },
    {
      id: "manual-ergonomics",
      label:
        "Manual lifting / ergonomics",
      hazardText:
        "Manual material handling and ergonomic overexertion",
    },
    {
      id: "load-movement",
      label:
        "Unexpected load movement",
      hazardText:
        "Unexpected load movement",
    },
    {
      id: "dropped-material",
      label:
        "Dropped material",
      hazardText:
        "Dropped material or falling-object exposure",
    },
    {
      id: "rigging-suspended",
      label:
        "Rigging / suspended load",
      hazardText:
        "Dropped or suspended load",
    },
  ];

type HazardControlReviewMode =
  | "Assign"
  | "Modify"
  | "NotApplicable";

type UnassignedUserControlReviewItem = {
  id: string;
  stepSequence: number;
  stepTitle: string;
  control: GeneratedHazardControlItem;
  targetHazards: GeneratedHazardControlItem[];
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

  signerId: string | null;
  signerName: string;
  signerEmail: string | null;

  required: boolean;
  status: SubmissionSignatureStatus;
  signedAt: string | null;
  signatureDataUrl: string | null;
};


type ResolvedPlanningApprovalRole = {
  code: string;
  label: string;
  required: boolean;
  order: number;
  signerName: string | null;
  signerId: string | null;
  signerEmail: string | null;
  sourceType: "Qoreva" | "RequirementPack";
  sources: Array<{
    requirementPackId: string | null;
    requirementPackName: string;
    packType: string;
    organizationName: string | null;
  }>;
};

type PlanningApprovalRoutingResponse = {
  routing?: {
    planningRecordId: string;
    tenantId: string;
    revisionNumber: number;
    planType: string;
    roles: ResolvedPlanningApprovalRole[];
    applicablePacks: Array<{
      id: string;
      name: string;
      packType: string;
      organizationName: string | null;
      version: number;
    }>;
    metadata: {
      baselineRoleCount: number;
      requirementPackRoleCount: number;
      resolvedRoleCount: number;
      applicablePackCount: number;
      resolverVersion: string;
    };
  };
  message?: string;
};

type PlanningApprovalEligibleUser = {
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

type PlanningApprovalEligibleRole = {
  roleCode: string;
  roleLabel: string;
  isRequired: boolean;
  sortOrder: number;

  sourceType:
    | "Qoreva"
    | "RequirementPack";

  sources: Array<{
    requirementPackId: string | null;
    requirementPackName: string;
    packType: string;
    organizationName: string | null;
  }>;

  configuredSigner: {
    userId: string | null;
    name: string | null;
    email: string | null;
  };

  eligibleUserCount: number;

  assignmentStatus:
    | "NoEligibleUsers"
    | "SingleEligibleUser"
    | "MultipleEligibleUsers";

  eligibleUsers:
    PlanningApprovalEligibleUser[];
};

type PlanningApprovalEligibilityResponse = {
  planningRecord?: {
    id: string;
    tenantId: string;
    projectId: string;
    revisionNumber: number;
    status: string;
  };

  routing?: {
    resolverVersion: string;
    applicablePackCount: number;
    roleCount: number;
    requiredRoleCount: number;
    requiredRoleCodes: string[];
  };

  roles?:
    PlanningApprovalEligibleRole[];

  readiness?: {
    hasApprovalRoute: boolean;
    hasRequiredApprovalRoute: boolean;

    unresolvedRequiredRoleCount: number;
    hasUnresolvedRequiredRoles: boolean;

    unresolvedRequiredRoles: Array<{
      roleCode: string;
      roleLabel: string;
    }>;
  };

  message?: string;
};

type PlanningApprovalAssignments =
  Record<string, string>;

type PlanningApprovalAssignmentConfirmations =
  Record<string, boolean>;

function normalizeApprovalRoleCode(
  value: string,
) {
  return value
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


type PlanningSubmissionReadinessResponse = {
  readiness?: {
    ready: boolean;

    compliance: {
      summary: {
        total: number;
        satisfied: number;
        unresolved: number;
        notEvaluated: number;
        submissionBlocking: number;
        approvalBlocking: number;
      };

      blockers: Array<{
        requirementRuleCode: string;
        requirementTitle: string;
        requirementPackName: string;
        packType: string;
        organizationName: string | null;
        questionCode: string;
        questionText: string;
        status: string;
        blockingLevel: string | null;
        message: string | null;
      }>;
    };
  };

  message?: string;
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
    submittedAt: string | null;
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
    reviews: Array<{
      id: string;
      revisionNumber: number;
      reviewerId: string | null;
      reviewerName: string;
      reviewerRole: string;
      status: string;
      confirmations: unknown;
      reviewNotes: string | null;
      startedAt: string;
      completedAt: string | null;
      createdAt: string;
      updatedAt: string;
      comments: Array<{
        id: string;
        targetId: string;
        section: string;
        label: string;
        comment: string;
        status: string;
        createdByName: string | null;
        createdAt: string;
        resolvedAt: string | null;
      }>;
    }>;
    signatures: Array<{
      id: string;
      revisionNumber: number;
      role: string;
      signerId: string | null;
      signerName: string;
      signerEmail: string | null;
      isRequired: boolean;
      sortOrder: number;
      status: string;
      signatureType: string;
      signatureStorageProvider: string | null;
      signatureStorageKey: string | null;
      signatureStorageUrl: string | null;
      signedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    revisions: Array<{
      revisionNumber: number;
      snapshot: {
        scope?: {
          safetyCriticalCategories?: string[];

          confirmedActivityCodes?: string[];

          detectedActivities?: Array<{
            activityCode: string;
            name: string;
            category: string;
            isHighRisk: boolean;
            score: number;
          }>;
        };
        sourceContext?: {
          selectedContractorDocumentIds?: string[];
        };
        qorevaDraftGeneration?:
          | (GeneratedPlanningDraft & {
              generatorVersion?: string;
            })
          | null;
      } | null;
    }>;
  };
  message?: string;
};

function normalizeReviewConfirmations(
  value: unknown,
): ReviewConfirmations {
  const defaults: ReviewConfirmations = {
    scope: false,
    sequence: false,
    hazards: false,
    controls: false,
    risk: false,
    requirements: false,
    emergency: false,
  };

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return defaults;
  }

  const record =
    value as Record<string, unknown>;

  return {
    scope:
      record.scope === true,
    sequence:
      record.sequence === true,
    hazards:
      record.hazards === true,
    controls:
      record.controls === true,
    risk:
      record.risk === true,
    requirements:
      record.requirements === true,
    emergency:
      record.emergency === true,
  };
}

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
    shortTitle: "Pre-Submit",
  },
  {
    number: 8,
    shortTitle: "Submit",
  },
];

export default function CreatePlanningPage() {
  const [currentStep, setCurrentStep] =
    useState(1);

  /*
   * Track actual wizard-step transitions so normal Next / Back /
   * Continue navigation can return the user to the top without
   * interfering with guided issue-resolution scrolling.
   */
  const previousStepRef =
    useRef(currentStep);

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
    hazardControlDecisions,
    setHazardControlDecisions,
  ] = useState<HazardControlDecision[]>([]);

  const [
    hazardControlDecisionsLoading,
    setHazardControlDecisionsLoading,
  ] = useState(false);

  const [
    hazardControlDecisionSavingId,
    setHazardControlDecisionSavingId,
  ] = useState<string | null>(null);

  const [
    hazardControlDecisionError,
    setHazardControlDecisionError,
  ] = useState("");

  const [
    hazardControlOverrideSavingId,
    setHazardControlOverrideSavingId,
  ] = useState<string | null>(null);

  const [
    hazardControlOverrideError,
    setHazardControlOverrideError,
  ] = useState("");

  const [
    hazardControlOverrides,
    setHazardControlOverrides,
  ] = useState<HazardControlOverride[]>([]);

  const [
    hazardControlOverridesLoading,
    setHazardControlOverridesLoading,
  ] = useState(false);

  const [
    lastRemovedHazard,
    setLastRemovedHazard,
  ] = useState<RemovedHazardUndoState | null>(
    null,
  );

  const [
    activeHazardEditor,
    setActiveHazardEditor,
  ] = useState<HazardEditorState | null>(
    null,
  );

  const [
    hazardEditorText,
    setHazardEditorText,
  ] = useState("");

  const [
    activeControlEditor,
    setActiveControlEditor,
  ] = useState<ControlEditorState | null>(
    null,
  );

  const [
    controlEditorText,
    setControlEditorText,
  ] = useState("");

  const [
    activeRecommendedControls,
    setActiveRecommendedControls,
  ] = useState<ActiveRecommendedControlsState | null>(null);

  const [
    selectedRecommendedControlIds,
    setSelectedRecommendedControlIds,
  ] = useState<string[]>([]);

  const [
    recommendedControlsLoadingKey,
    setRecommendedControlsLoadingKey,
  ] = useState<string | null>(null);

  const [
    recommendedControlsSaving,
    setRecommendedControlsSaving,
  ] = useState(false);

  const [
    recommendedControlsError,
    setRecommendedControlsError,
  ] = useState("");

  const [
    activeHazardResolution,
    setActiveHazardResolution,
  ] = useState<HazardEditorState | null>(
    null,
  );

  const [
    selectedHazardResolutionIds,
    setSelectedHazardResolutionIds,
  ] = useState<string[]>([]);

  const [
    customHazardResolutionText,
    setCustomHazardResolutionText,
  ] = useState("");

  const [
    expandedHazardIds,
    setExpandedHazardIds,
  ] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [
    guidedHazardTargetId,
    setGuidedHazardTargetId,
  ] = useState<string | null>(null);

  const [
    guidedControlAssignmentTarget,
    setGuidedControlAssignmentTarget,
  ] = useState(false);

  const [
    guidedRequirementQuestionCode,
    setGuidedRequirementQuestionCode,
  ] = useState<string | null>(null);

  function scrollPlanningPageToTop(
    behavior: ScrollBehavior = "smooth",
  ) {
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior,
      });
    });
  }

  /*
   * Qoreva Planning navigation standard:
   *
   * - Normal wizard step changes return the user to the top.
   * - Guided issue-resolution actions keep ownership of scrolling
   *   so Resolve Requirement / Review actions can land directly on
   *   the exact item that needs attention.
   */
  useEffect(() => {
    if (
      previousStepRef.current ===
      currentStep
    ) {
      return;
    }

    previousStepRef.current =
      currentStep;

    if (
      guidedHazardTargetId ||
      guidedControlAssignmentTarget ||
      guidedRequirementQuestionCode
    ) {
      return;
    }

    scrollPlanningPageToTop();
  }, [
    currentStep,
    guidedHazardTargetId,
    guidedControlAssignmentTarget,
    guidedRequirementQuestionCode,
  ]);

  const [
    activeHazardControlReviewId,
    setActiveHazardControlReviewId,
  ] = useState<string | null>(null);

  const [
    hazardControlReviewMode,
    setHazardControlReviewMode,
  ] = useState<HazardControlReviewMode | null>(
    null,
  );

  const [
    selectedTargetHazardId,
    setSelectedTargetHazardId,
  ] = useState("");

  const [
    modifiedControlText,
    setModifiedControlText,
  ] = useState("");

  const [
    qualifiedReviewSaving,
    setQualifiedReviewSaving,
  ] = useState(false);

  const [
    submissionSaving,
    setSubmissionSaving,
  ] = useState(false);


  const [
    approvalRoutingLoading,
    setApprovalRoutingLoading,
  ] = useState(false);

  const [
    approvalRoutingError,
    setApprovalRoutingError,
  ] = useState("");

  const [
    approvalEligibility,
    setApprovalEligibility,
  ] = useState<
    PlanningApprovalEligibilityResponse | null
  >(null);

  const [
    approvalEligibilityLoading,
    setApprovalEligibilityLoading,
  ] = useState(false);

  const [
    approvalEligibilityError,
    setApprovalEligibilityError,
  ] = useState("");

  const [
    approvalAssignments,
    setApprovalAssignments,
  ] = useState<PlanningApprovalAssignments>({});

  const [
    approvalAssignmentConfirmations,
    setApprovalAssignmentConfirmations,
  ] = useState<
    PlanningApprovalAssignmentConfirmations
  >({});

  const [
    submissionReadiness,
    setSubmissionReadiness,
  ] = useState<
    PlanningSubmissionReadinessResponse["readiness"] | null
  >(null);

  const [
    submissionReadinessLoading,
    setSubmissionReadinessLoading,
  ] = useState(false);

  const [
    submissionReadinessError,
    setSubmissionReadinessError,
  ] = useState("");

  const [
    planningRevisionNumber,
    setPlanningRevisionNumber,
  ] = useState(1);

  const [
    highestReachedStep,
    setHighestReachedStep,
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
    planSpecificDocuments,
    setPlanSpecificDocuments,
  ] = useState<PersistedPlanningSourceDocument[]>([]);

  const [
    planSpecificUploadSaving,
    setPlanSpecificUploadSaving,
  ] = useState(false);

  const [
    planSpecificUploadError,
    setPlanSpecificUploadError,
  ] = useState("");

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
    planningCompliance,
    setPlanningCompliance,
  ] = useState<PlanningComplianceEvaluation | null>(null);

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
          record.status !== "Draft" &&
          record.status !== "Submitted"
        ) {
          throw new Error(
            `Only Draft or Submitted planning records can be opened in this workflow. This record is currently ${record.status}.`,
          );
        }

        const submittedRecord =
          record.status === "Submitted";

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

        const currentRevision =
          record.revisions.find(
            (revision) =>
              revision.revisionNumber ===
              record.revisionNumber,
          ) ?? null;

        const previousRevision =
          record.revisions.find(
            (revision) =>
              revision.revisionNumber ===
              record.revisionNumber - 1,
          ) ?? null;

        /*
         * Prefer the active revision snapshot whenever it exists.
         * A prior revision is used only as edit-mode context when the
         * active revision has not yet been generated.
         */
        const contextRevision =
          currentRevision ??
          previousRevision;

        const currentReview =
          record.reviews.find(
            (review) =>
              review.revisionNumber ===
                record.revisionNumber &&
              review.status ===
                "Completed",
          ) ?? null;

        const restoredGeneratedDraft =
          currentRevision?.snapshot
            ?.qorevaDraftGeneration ??
          null;

        /*
         * Restore the authoritative active/confirmed PlanningActivity
         * records before the user can continue through Guided Planning.
         *
         * This prevents a refreshed/reopened planning record from starting
         * with empty React activity state and accidentally sending
         * confirmedActivities: [] back to the PUT endpoint.
         *
         * The database remains the source of truth for which activities are
         * currently confirmed. Revision snapshot detection metadata is used
         * only to enrich UI-only fields such as isHighRisk when available.
         */
        const activityHydrationResponse =
          await fetch(
            `/api/planning/${record.id}/guided-planning`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const activityHydrationData =
          (await activityHydrationResponse.json()) as
            GuidedPlanningActivitiesResponse;

        if (!activityHydrationResponse.ok) {
          throw new Error(
            activityHydrationData.message ||
              "Unable to restore the confirmed planning activities.",
          );
        }

        const snapshotDetectedActivities =
          contextRevision?.snapshot
            ?.scope
            ?.detectedActivities ??
          [];

        const snapshotActivityByCode =
          new Map(
            snapshotDetectedActivities.map(
              (activity) => [
                activity.activityCode,
                activity,
              ],
            ),
          );

        const restoredDetectedActivities:
          DetectedPlanningActivity[] =
          (
            activityHydrationData.activities ??
            []
          ).map(
            (
              activity,
              index,
            ) => {
              const snapshotActivity =
                snapshotActivityByCode.get(
                  activity.activityCode,
                );

              const hydratedScore =
                Number.isFinite(
                  Number(
                    activity.score,
                  ),
                )
                  ? Number(
                      activity.score,
                    )
                  : snapshotActivity?.score ??
                    0;

              return {
                id:
                  `persisted-${activity.activityCode}-${index}`,

                activityCode:
                  activity.activityCode,

                name:
                  activity.name,

                category:
                  activity.category ??
                  snapshotActivity?.category ??
                  "General",

                isHighRisk:
                  snapshotActivity?.isHighRisk ??
                  false,

                matchedKeywords: [],

                score:
                  hydratedScore,

                sourceType:
                  activity.detectionSource ??
                  "System",
              };
            },
          );

        const restoredConfirmedActivityCodes =
          restoredDetectedActivities.map(
            (activity) =>
              activity.activityCode,
          );

        const restoredReviewConfirmations =
          normalizeReviewConfirmations(
            currentReview?.confirmations,
          );

        const restoredReviewComments:
          ReviewComment[] =
          currentReview
            ? currentReview.comments.map(
                (comment) => ({
                  id:
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
                    comment.status ===
                    "Resolved"
                      ? "Resolved"
                      : "Open",
                  createdBy:
                    comment.createdByName ??
                    currentReview.reviewerName ??
                    "Pre-Submission Reviewer",
                  createdAt:
                    comment.createdAt,
                  resolvedAt:
                    comment.resolvedAt,
                }),
              )
            : [];

        const restoredSubmissionSignatures:
          SubmissionSignature[] =
          record.signatures
            .filter(
              (signature) =>
                signature.revisionNumber ===
                record.revisionNumber,
            )
            .map(
              (signature) => ({
                id:
                  signature.id,
                role:
                  signature.role,

                signerId:
                  signature.signerId,

                signerName:
                  signature.signerName,

                signerEmail:
                  signature.signerEmail,

                required:
                  signature.isRequired,
                status:
                  signature.status ===
                  "Signed"
                    ? "Signed"
                    : "Pending",
                signedAt:
                  signature.signedAt,
                signatureDataUrl:
                  signature.signatureStorageUrl,
              }),
            );

        const snapshotCategories =
          contextRevision?.snapshot
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
          contextRevision?.snapshot
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

        setDetectedActivities(
          restoredDetectedActivities,
        );

        setConfirmedActivityCodes(
          restoredConfirmedActivityCodes,
        );

        setActivityDetectionError("");

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

        setDraftGenerated(
          Boolean(
            restoredGeneratedDraft,
          ),
        );
        setGeneratedPlanningDraft(
          restoredGeneratedDraft,
        );

        /*
         * Qualified-review state is revision-scoped.
         * Restore only a review whose revisionNumber matches the
         * Planning record's active revision. Never carry review
         * approval or comments forward from an older revision.
         */
        setReviewerName(
          currentReview?.reviewerName ??
            "",
        );
        setReviewerRole(
          currentReview?.reviewerRole ??
            "",
        );
        setReviewNotes(
          currentReview?.reviewNotes ??
            "",
        );
        setReviewConfirmations(
          restoredReviewConfirmations,
        );
        setReviewComments(
          restoredReviewComments,
        );
        setActiveReviewTargetId(null);
        setReviewCommentDraft("");

        /*
         * Submission/signature state is revision-scoped.
         * Restore only signatures tied to the Planning record's
         * active revision. Never carry signatures from an older
         * revision into a new working revision.
         */
        setSubmissionSignatures(
          restoredSubmissionSignatures,
        );
        setSubmissionAcknowledged(
          submittedRecord,
        );
        setSubmitted(
          submittedRecord,
        );
        setSubmittedAt(
          submittedRecord
            ? record.submittedAt
            : null,
        );
        setAdditionalApproverRole("");
        setAdditionalApproverName("");

        /*
         * Resume at the most advanced safe point represented by
         * persisted state.
         *
         * Submitted records reopen at Step 8 in read-only mode.
         * A Draft with persisted signatures also resumes at Step 8.
         * A completed/current review resumes at Step 7.
         * A generated current draft resumes at Step 6.
         * Otherwise edit mode begins at Work Scope.
         */
        const resumeStep =
          submittedRecord ||
          restoredSubmissionSignatures.length > 0
            ? 8
            : currentReview
              ? 7
              : restoredGeneratedDraft
                ? 6
                : 4;

        setHighestReachedStep(
          resumeStep,
        );
        setCurrentStep(
          resumeStep,
        );

        if (
          !submittedRecord &&
          currentReview &&
          restoredSubmissionSignatures.length === 0
        ) {
          try {
            await loadApprovalRouting(
              record.id,
            );

            try {
              await loadSubmissionReadiness(
                record.id,
              );
            } catch {
              /*
               * Keep Step 8 accessible when the readiness
               * preview is temporarily unavailable.
               * Submission remains server-enforced.
               */
            }

            if (!cancelled) {
              setHighestReachedStep(8);
              setCurrentStep(8);
            }
          } catch {
            /*
             * Keep the hydrated pre-submission review visible.
             * The Step 8 routing error UI will provide a retry.
             */
          }
        }

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
        /*
         * Guided Planning questions require a
         * persisted Planning Record.
         *
         * The Planning Record is created during the
         * Assignment step and is the trusted
         * server-side source for tenant, company,
         * project, contractor, plan type, and
         * Requirement Pack applicability.
         */
        if (
          !selectedProject ||
          !planningRecordId
        ) {
          return;
        }

        setGuidedQuestionsLoading(true);
        setGuidedQuestionsError("");

        try {
          /*
           * Send the current Guided Planning answers
           * so deterministic requirement rules and
           * follow-up questions can react immediately
           * before the final Guided Planning save.
           */
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

          /*
           * Do not send tenantId from the browser.
           *
           * The API resolves tenant/project/company/
           * contractor context from planningRecordId,
           * then resolves applicable Requirement Packs
           * and individual Requirement Rules on the
           * server before evaluating question
           * visibility.
           */
          const response = await fetch(
            "/api/planning/question-evaluation",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                planningRecordId,
                activityCodes: confirmedActivityCodes,
                answers,
              }),
            },
          );

          const data = (await response.json()) as {
            questions?: DynamicPlanningQuestion[];
            compliance?: PlanningComplianceEvaluation;
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

            setPlanningCompliance(
              data.compliance ?? null,
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
    planningRecordId,
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
                } not marked as safety-critical. Confirm this is intentional during pre-submission review.`,
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
            : planSpecificDocuments.length > 0
              ? `${planSpecificDocuments.length} plan-specific supporting document${
                  planSpecificDocuments.length === 1
                    ? ""
                    : "s"
                } saved to this Planning draft; no contractor source documents are selected.`
              : "No source documents are selected. The plan may continue using user-entered information, but document intelligence will be limited.",
        status:
          selectedDocumentIds.length > 0 ||
          planSpecificDocuments.length > 0
            ? "Pass"
            : "Warning",
      });

      return checks;
    }, [
      activeWorkSteps,
      emergencyPlan,
      highRiskSteps,
      planSpecificDocuments.length,
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


  const hazardControlDecisionByRecommendationId =
    useMemo(
      () =>
        new Map(
          hazardControlDecisions.map(
            (decision) => [
              decision.recommendationId,
              decision,
            ],
          ),
        ),
      [hazardControlDecisions],
    );

  const removedHazardOverrides =
    useMemo(
      () =>
        hazardControlOverrides.filter(
          (override) =>
            override.itemType === "Hazard" &&
            override.action === "Remove" &&
            Boolean(override.originalText?.trim()),
        ),
      [hazardControlOverrides],
    );

  const allUnassignedUserControlReviewItems =
    useMemo<UnassignedUserControlReviewItem[]>(
      () => {
        if (!generatedPlanningDraft) {
          return [];
        }

        return generatedPlanningDraft.workSteps.flatMap(
          (step) => {
            const groups =
              step.hazardControlGroups ?? [];

            const targetHazards =
              groups
                .filter(
                  (group) =>
                    group.hazard.text !==
                    "User-entered controls requiring hazard assignment",
                )
                .map(
                  (group) =>
                    group.hazard,
                );

            return groups
              .filter(
                (group) =>
                  group.hazard.text ===
                  "User-entered controls requiring hazard assignment",
              )
              .flatMap((group) =>
                group.controls.map(
                  (control) => ({
                    id: `${step.sequence}-${group.id}-${control.id}`,
                    stepSequence:
                      step.sequence,
                    stepTitle:
                      step.title,
                    control,
                    targetHazards,
                  }),
                ),
              );
          },
        );
      },
      [generatedPlanningDraft],
    );

  const unassignedUserControlReviewItems =
    useMemo(
      () =>
        allUnassignedUserControlReviewItems.filter(
          (item) =>
            !hazardControlDecisionByRecommendationId.has(
              item.control.id,
            ),
        ),
      [
        allUnassignedUserControlReviewItems,
        hazardControlDecisionByRecommendationId,
      ],
    );

  const resolvedUserControlReviewItems =
    useMemo(
      () =>
        allUnassignedUserControlReviewItems.filter(
          (item) =>
            hazardControlDecisionByRecommendationId.has(
              item.control.id,
            ),
        ),
      [
        allUnassignedUserControlReviewItems,
        hazardControlDecisionByRecommendationId,
      ],
    );

  const unresolvedUserHazardReviewItems =
    useMemo(() => {
      if (!generatedPlanningDraft) {
        return [];
      }

      return generatedPlanningDraft.workSteps.flatMap(
        (step) =>
          (step.hazardControlGroups ?? [])
            .filter(
              (group) =>
                group.hazard.source === "User" &&
                group.controls.length === 0 &&
                group.hazard.text !==
                  "User-entered controls requiring hazard assignment",
            )
            .map((group) => ({
              stepSequence: step.sequence,
              stepTitle: step.title,
              hazard: group.hazard,
            })),
      );
    }, [generatedPlanningDraft]);


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

  const approvalAssignmentSummary =
    useMemo(() => {
      const roles =
        approvalEligibility?.roles ??
        [];

      const requiredRoles =
        roles.filter(
          (role) =>
            role.isRequired,
        );

      const assignedRequired =
        requiredRoles.filter(
          (role) =>
            Boolean(
              approvalAssignments[
                role.roleCode
              ],
            ),
        ).length;

      const confirmedRequired =
        requiredRoles.filter(
          (role) =>
            Boolean(
              approvalAssignments[
                role.roleCode
              ],
            ) &&
            approvalAssignmentConfirmations[
              role.roleCode
            ] === true,
        ).length;

      const unresolvedRequired =
        requiredRoles.filter(
          (role) =>
            !approvalAssignments[
              role.roleCode
            ] ||
            approvalAssignmentConfirmations[
              role.roleCode
            ] !== true,
        ).length;

      return {
        required:
          requiredRoles.length,

        assignedRequired,

        confirmedRequired,

        unresolvedRequired,

        allRequiredConfirmed:
          requiredRoles.length > 0 &&
          unresolvedRequired === 0,
      };
    }, [
      approvalEligibility,
      approvalAssignments,
      approvalAssignmentConfirmations,
    ]);

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
    setPlanSpecificDocuments([]);
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

  async function uploadPlanSpecificDocuments(
    files: File[],
  ) {
    if (files.length === 0) {
      return;
    }

    if (!planningRecordId) {
      setPlanSpecificUploadError(
        "Save the Planning draft before adding supporting documents.",
      );
      return;
    }

    setPlanSpecificUploadError("");
    setPlanSpecificUploadSaving(true);

    try {
      const formData =
        new FormData();

      for (const file of files) {
        formData.append(
          "files",
          file,
        );
      }

      const response =
        await fetch(
          `/api/planning/${planningRecordId}/source-documents`,
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        (await response.json()) as {
          documents?: PersistedPlanningSourceDocument[];
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to upload the supporting documents.",
        );
      }

      if (
        !data.documents ||
        data.documents.length === 0
      ) {
        throw new Error(
          "The supporting documents were uploaded without a source-document record.",
        );
      }

      setPlanSpecificDocuments(
        (current) => {
          const byId =
            new Map(
              current.map(
                (document) => [
                  document.id,
                  document,
                ],
              ),
            );

          for (
            const document of
            data.documents ?? []
          ) {
            byId.set(
              document.id,
              document,
            );
          }

          return Array.from(
            byId.values(),
          );
        },
      );
    } catch (error) {
      setPlanSpecificUploadError(
        error instanceof Error
          ? error.message
          : "Unable to upload the supporting documents.",
      );
    } finally {
      setPlanSpecificUploadSaving(
        false,
      );
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

    const completedSequence =
      workSequence.filter(
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
        (step) =>
          !step.title.trim(),
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
        Number(
          normalizedCrewSize,
        );

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
      /*
       * Save the Step 4 record-level scope first.
       */
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

      /*
       * Persist the preliminary Step 4 work sequence before
       * Guided Planning begins.
       *
       * Step 4 owns:
       * - sequence
       * - title
       * - description
       *
       * Step 5 later enriches the same work steps with hazards,
       * controls, safety-critical designation, and risk level.
       */
      const workSequenceResponse =
        await fetch(
          `/api/planning/${planningRecordId}/work-sequence`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              workSteps:
                completedSequence.map(
                  (
                    step,
                    index,
                  ) => ({
                    sequence:
                      index + 1,
                    title:
                      step.title.trim(),
                    description:
                      step.description.trim() ||
                      null,
                  }),
                ),
            }),
          },
        );

      const workSequenceData =
        (await workSequenceResponse.json()) as {
          workSteps?: Array<{
            id: string;
            sequence: number;
            title: string;
            description: string | null;
          }>;
          saved?: {
            workSteps: number;
          };
          message?: string;
        };

      if (!workSequenceResponse.ok) {
        throw new Error(
          workSequenceData.message ||
            "Unable to save the work sequence.",
        );
      }

      if (
        !workSequenceData.saved ||
        workSequenceData.saved.workSteps !==
          completedSequence.length
      ) {
        throw new Error(
          "The work sequence was not confirmed as fully saved.",
        );
      }

      /*
       * Replace temporary browser IDs with persisted database IDs
       * so Step 5 planning state and future draft hydration use the
       * same PlanningWorkStep records.
       */
      const persistedWorkSequence =
        (
          workSequenceData.workSteps ??
          []
        )
          .slice()
          .sort(
            (a, b) =>
              a.sequence -
              b.sequence,
          )
          .map((step) => ({
            id: step.id,
            title: step.title,
            description:
              step.description ?? "",
          }));

      if (
        persistedWorkSequence.length !==
        completedSequence.length
      ) {
        throw new Error(
          "The persisted work sequence could not be loaded after save.",
        );
      }

      setWorkSequence(
        persistedWorkSequence,
      );

      /*
       * Preserve any Step 5 planning state that already exists
       * when a user returns to Step 4 and edits the sequence.
       *
       * Existing planning is matched by sequence position because
       * Step 4 persistence replaces the preliminary work-step rows
       * and therefore generates new database IDs.
       */
      const nextWorkStepPlanning: Record<
        string,
        WorkStepPlanning
      > = {};

      persistedWorkSequence.forEach(
        (step, index) => {
          const priorClientStep =
            completedSequence[index];

          const priorPlanning =
            priorClientStep
              ? workStepPlanning[
                  priorClientStep.id
                ]
              : undefined;

          nextWorkStepPlanning[
            step.id
          ] = priorPlanning ?? {
            hazards: "",
            controls: "",
            safetyCritical: false,
            riskLevel: "",
          };
        },
      );

      setWorkStepPlanning(
        nextWorkStepPlanning,
      );

      /*
       * Analyze the persisted work scope for applicable activities.
       */
      const activityScopeText = [
        scopeTitle.trim(),
        scopeDescription.trim(),
        equipmentTools.trim(),
        materialsChemicals.trim(),
        adjacentWork.trim(),
        specialConditions.trim(),
        ...completedSequence.flatMap(
          (step) => [
            step.title.trim(),
            step.description.trim(),
          ],
        ),
      ]
        .filter(Boolean)
        .join(". ");

      const activityResponse =
        await fetch(
          "/api/planning/activity-detection",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              projectId:
                selectedProject.id,
              scopeText:
                activityScopeText,
            }),
          },
        );

      const activityData =
        (await activityResponse.json()) as {
          activities?:
            DetectedPlanningActivity[];
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

      /*
       * Checkpoint the detected activities immediately after
       * Step 4 analysis so refresh/reopen cannot lose the activity
       * context before Guided Planning is completed.
       *
       * Step 4 currently auto-selects every detected activity.
       * Persist that same initial selected state here. Step 5 remains
       * the qualified-user review point and its existing Guided Planning
       * save can remove any activities the user deselects.
       */
      const activityCheckpointResponse =
        await fetch(
          `/api/planning/${planningRecordId}/activities`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              activities:
                nextDetectedActivities.map(
                  (activity) => ({
                    activityCode:
                      activity.activityCode,

                    name:
                      activity.name,

                    category:
                      activity.category,

                    detectionSource:
                      activity.sourceType ||
                      "System",

                    score:
                      activity.score,
                  }),
                ),

              confirmedBy:
                responsibleSupervisor.trim() ||
                null,
            }),
          },
        );

      const activityCheckpointData =
        (await activityCheckpointResponse.json()) as {
          saved?: {
            activities: number;
            removedActivities: number;
          };
          message?: string;
        };

      if (!activityCheckpointResponse.ok) {
        throw new Error(
          activityCheckpointData.message ||
            "Unable to save the detected planning activities.",
        );
      }

      if (
        !activityCheckpointData.saved ||
        activityCheckpointData.saved.activities !==
          nextDetectedActivities.length
      ) {
        throw new Error(
          "The detected planning activities were not confirmed as fully saved.",
        );
      }

      setDetectedActivities(
        nextDetectedActivities,
      );

      setConfirmedActivityCodes(
        nextDetectedActivities.map(
          (activity) =>
            activity.activityCode,
        ),
      );

      /*
       * Prefill the core guided-planning answers from the
       * Step 4 scope fields.
       */
      setPlanningAnswers(
        (current) => ({
          ...current,

          CORE_SCOPE_DESCRIPTION: {
            value:
              scopeDescription.trim(),
            notes:
              current
                .CORE_SCOPE_DESCRIPTION
                ?.notes ?? "",
          },

          CORE_WORK_LOCATION: {
            value:
              workLocation.trim(),
            notes:
              current
                .CORE_WORK_LOCATION
                ?.notes ?? "",
          },

          CORE_CREW_SIZE: {
            value:
              crewSize.trim(),
            notes:
              current
                .CORE_CREW_SIZE
                ?.notes ?? "",
          },

          CORE_EQUIPMENT_TOOLS: {
            value:
              equipmentTools.trim(),
            notes:
              current
                .CORE_EQUIPMENT_TOOLS
                ?.notes ?? "",
          },

          CORE_MATERIALS: {
            value:
              materialsChemicals.trim(),
            notes:
              current
                .CORE_MATERIALS
                ?.notes ?? "",
          },
        }),
      );

      setCurrentStep(5);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save and analyze the work scope.";

      setActivityDetectionError(
        message,
      );
      setStepError(
        message,
      );
    } finally {
      setPlanningDraftSaving(
        false,
      );
      setActivityDetectionLoading(
        false,
      );
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

  async function generateDraftPlan(): Promise<boolean> {
    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before building the plan.",
      );
      return false;
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

          planSpecificDocuments:
            planSpecificDocuments.map(
              (document) => ({
                id:
                  document.id,

                sourceType:
                  document.sourceType,

                label:
                  document.label,

                fileName:
                  document.fileName,

                mimeType:
                  document.mimeType,

                fileSize:
                  document.fileSize,

                storageProvider:
                  document.storageProvider,

                storageKey:
                  document.storageKey,

                isSelected:
                  document.isSelected,

                isAiReady:
                  document.isAiReady,
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
                  ? "Qoreva-assisted draft refreshed before pre-submission review."
                  : "Initial Qoreva-assisted draft generated for pre-submission review.",

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

          reviewInvalidated?: boolean;
          invalidatedSignatureCount?: number;
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

      if (data.reviewInvalidated) {
        setReviewConfirmations({
          scope: false,
          sequence: false,
          hazards: false,
          controls: false,
          risk: false,
          requirements: false,
          emergency: false,
        });

        setSubmissionSignatures([]);
        setSubmissionAcknowledged(false);
        setSubmitted(false);
        setSubmittedAt(null);
        setSubmissionReadiness(null);
        setSubmissionReadinessError(
          "",
        );
      }

      return true;
    } catch (error) {
      setDraftGenerated(false);

      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to generate and persist the planning draft.",
      );

      return false;
    } finally {
      setDraftBuildSaving(false);
    }
  }

  useEffect(() => {
    if (!planningRecordId) {
      setHazardControlDecisions([]);
      return;
    }

    let cancelled = false;

    async function loadHazardControlDecisions() {
      setHazardControlDecisionsLoading(
        true,
      );
      setHazardControlDecisionError("");

      try {
        const response =
          await fetch(
            `/api/planning/${planningRecordId}/hazard-control-decisions`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const data =
          (await response.json()) as {
            decisions?: HazardControlDecision[];
            message?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load hazard/control review decisions.",
          );
        }

        if (!cancelled) {
          setHazardControlDecisions(
            data.decisions ?? [],
          );
        }
      } catch (error) {
        if (!cancelled) {
          setHazardControlDecisionError(
            error instanceof Error
              ? error.message
              : "Unable to load hazard/control review decisions.",
          );
        }
      } finally {
        if (!cancelled) {
          setHazardControlDecisionsLoading(
            false,
          );
        }
      }
    }

    void loadHazardControlDecisions();

    return () => {
      cancelled = true;
    };
  }, [planningRecordId]);

  async function loadHazardControlOverrides(
    activePlanningRecordId: string,
  ) {
    setHazardControlOverridesLoading(true);

    try {
      const response =
        await fetch(
          `/api/planning/${activePlanningRecordId}/hazard-control-overrides`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as {
          overrides?: HazardControlOverride[];
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load hazard/control changes.",
        );
      }

      setHazardControlOverrides(
        data.overrides ?? [],
      );
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to load hazard/control changes.",
      );
    } finally {
      setHazardControlOverridesLoading(false);
    }
  }

  useEffect(() => {
    if (!planningRecordId) {
      setHazardControlOverrides([]);
      return;
    }

    void loadHazardControlOverrides(
      planningRecordId,
    );
  }, [planningRecordId]);

  function findPersistedWorkStepId(
    stepSequence: number,
    stepTitle: string,
  ) {
    const matchedStep =
      activeWorkSteps.find(
        (workStep, index) =>
          index + 1 === stepSequence ||
          workStep.title
            .trim()
            .toLowerCase() ===
            stepTitle
              .trim()
              .toLowerCase(),
      );

    return matchedStep?.id ?? null;
  }

  function toggleHazardExpanded(
    hazardId: string,
  ) {
    setExpandedHazardIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(hazardId)) {
          next.delete(hazardId);
        } else {
          next.add(hazardId);
        }

        return next;
      },
    );
  }

  function setWorkStepHazardsExpanded(
    hazardIds: string[],
    expanded: boolean,
  ) {
    setExpandedHazardIds(
      (current) => {
        const next =
          new Set(current);

        for (
          const hazardId of
          hazardIds
        ) {
          if (expanded) {
            next.add(hazardId);
          } else {
            next.delete(hazardId);
          }
        }

        return next;
      },
    );
  }

  function guideToUnresolvedHazard(
    hazardId: string,
  ) {
    setGuidedControlAssignmentTarget(false);
    setGuidedHazardTargetId(hazardId);
    setExpandedHazardIds((current) => {
      const next = new Set(current);
      next.add(hazardId);
      return next;
    });
    setStepError("");
    setCurrentStep(6);
  }

  function guideToControlAssignmentReview() {
    setGuidedHazardTargetId(null);
    setGuidedControlAssignmentTarget(true);
    setStepError("");
    setCurrentStep(6);
  }

  function guideToRequirementQuestion(
    questionCode: string,
  ) {
    const normalizedQuestionCode =
      questionCode.trim();

    if (!normalizedQuestionCode) {
      setStepError(
        "Qoreva could not identify the planning question tied to this requirement.",
      );

      return;
    }

    setGuidedHazardTargetId(null);
    setGuidedControlAssignmentTarget(false);

    setGuidedRequirementQuestionCode(
      normalizedQuestionCode,
    );

    setStepError("");
    setCurrentStep(5);

    /*
     * Give the destination step a clean starting position while the
     * dedicated guided-question effect locates and focuses the exact
     * requirement question.
     */
    scrollPlanningPageToTop();
  }

  useEffect(() => {
    if (currentStep !== 6) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (guidedHazardTargetId) {
        const target = document.querySelector<HTMLElement>(
          `[data-guided-hazard-id="${CSS.escape(guidedHazardTargetId)}"]`,
        );

        if (target) {
          const workStepDetails = target.closest("details");
          if (workStepDetails instanceof HTMLDetailsElement) {
            workStepDetails.open = true;
          }

          target.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          target.focus({ preventScroll: true });
          setGuidedHazardTargetId(null);
        }
        return;
      }

      if (guidedControlAssignmentTarget) {
        const target = document.getElementById(
          "qoreva-control-assignment-review",
        );

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setGuidedControlAssignmentTarget(false);
        }
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [
    currentStep,
    guidedHazardTargetId,
    guidedControlAssignmentTarget,
    generatedPlanningDraft,
  ]);

  useEffect(() => {
    if (
      currentStep !== 5 ||
      !guidedRequirementQuestionCode
    ) {
      return;
    }

    let attempt = 0;

    const locateTarget = () => {
      const targetId =
        `qoreva-guided-question-${guidedRequirementQuestionCode}`;

      const target =
        document.getElementById(
          targetId,
        );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        target.focus({
          preventScroll: true,
        });

        target.classList.add(
          "ring-4",
          "ring-[rgba(220,38,38,0.18)]",
          "border-[#F0BDC4]",
        );

        window.setTimeout(() => {
          target.classList.remove(
            "ring-4",
            "ring-[rgba(220,38,38,0.18)]",
            "border-[#F0BDC4]",
          );
        }, 2400);

        setGuidedRequirementQuestionCode(
          null,
        );

        return;
      }

      attempt += 1;

      if (attempt < 12) {
        window.setTimeout(
          locateTarget,
          120,
        );
      }
    };

    const timer =
      window.setTimeout(
        locateTarget,
        100,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    currentStep,
    guidedRequirementQuestionCode,
    guidedPlanningQuestions,
  ]);

  function openAddHazardEditor(
    step: GeneratedDraftWorkStep,
  ) {
    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before adding a hazard.",
      );
      return;
    }

    setActiveHazardEditor({
      operationKey:
        `hazard-add:${step.sequence}:${Date.now()}`,
      mode: "Add",
      stepSequence:
        step.sequence,
      stepTitle:
        step.title,
      workStepId,
      groupId: null,
      hazardId: null,
      originalText: null,
      sourceType: "User",
      sourceActivityCodes: [],
      sourceQuestionCodes: [],
      sourceRequirementIds: [],
      required: false,
    });

    setHazardEditorText("");
    setHazardControlOverrideError("");
    setStepError("");
  }

  function openExistingHazardEditor(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
    mode: Extract<
      HazardEditMode,
      "Edit" | "Change"
    >,
  ) {
    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before editing the hazard.",
      );
      return;
    }

    setActiveHazardEditor({
      operationKey:
        `hazard-${mode.toLowerCase()}:${step.sequence}:${group.hazard.id}`,
      mode,
      stepSequence:
        step.sequence,
      stepTitle:
        step.title,
      workStepId,
      groupId:
        group.id,
      hazardId:
        group.hazard.id,
      originalText:
        group.hazard.text,
      sourceType:
        group.hazard.source,
      sourceActivityCodes:
        group.hazard
          .sourceActivityCodes,
      sourceQuestionCodes:
        group.hazard
          .sourceQuestionCodes,
      sourceRequirementIds:
        group.hazard
          .sourceRequirementIds,
      required:
        group.hazard.required,
    });

    setHazardEditorText(
      group.hazard.text,
    );
    setHazardControlOverrideError("");
    setStepError("");
  }

  function cancelHazardEditor() {
    setActiveHazardEditor(null);
    setHazardEditorText("");
    setHazardControlOverrideError("");
  }

  async function saveHazardOverride() {
    if (!activeHazardEditor) {
      return;
    }

    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before hazards can be changed.",
      );
      return;
    }

    const finalText =
      hazardEditorText.trim();

    if (!finalText) {
      setHazardControlOverrideError(
        activeHazardEditor.mode ===
          "Add"
          ? "Enter the hazard to add."
          : "Enter the final hazard wording before saving.",
      );
      return;
    }

    if (
      activeHazardEditor.mode ===
        "Edit" &&
      finalText ===
        activeHazardEditor.originalText
          ?.trim()
    ) {
      cancelHazardEditor();
      return;
    }

    const operationKey =
      activeHazardEditor.operationKey;

    const savingId =
      activeHazardEditor.hazardId ??
      operationKey;

    setHazardControlOverrideSavingId(
      savingId,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-overrides`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              operationKey,
              workStepId:
                activeHazardEditor.workStepId,
              workStepSequence:
                activeHazardEditor.stepSequence,
              workStepTitle:
                activeHazardEditor.stepTitle,
              itemType:
                "Hazard",
              action:
                activeHazardEditor.mode,
              targetItemId:
                activeHazardEditor.mode ===
                  "Add"
                  ? null
                  : activeHazardEditor.hazardId,
              parentHazardId:
                null,
              originalText:
                activeHazardEditor.mode ===
                  "Add"
                  ? null
                  : activeHazardEditor.originalText,
              finalText,
              canonicalHazardConceptId:
                null,
              sourceType:
                activeHazardEditor.mode ===
                  "Add"
                  ? "User"
                  : activeHazardEditor.sourceType,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                groupId:
                  activeHazardEditor.groupId,
                sourceActivityCodes:
                  activeHazardEditor
                    .sourceActivityCodes,
                sourceQuestionCodes:
                  activeHazardEditor
                    .sourceQuestionCodes,
                sourceRequirementIds:
                  activeHazardEditor
                    .sourceRequirementIds,
                required:
                  activeHazardEditor.required,
                editMode:
                  activeHazardEditor.mode,
              },
              reason:
                activeHazardEditor.mode ===
                  "Change"
                  ? "Qualified user changed the hazard classification or meaning."
                  : null,
              changedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              changedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          override?: HazardControlOverride;
          message?: string;
        };

      if (
        !response.ok ||
        !data.override
      ) {
        throw new Error(
          data.message ||
            "Unable to save the hazard change.",
        );
      }

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "Your hazard change was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      cancelHazardEditor();
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to save the hazard change.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  async function removeHazard(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
  ) {
    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before hazards can be removed.",
      );
      return;
    }

    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before removing the hazard.",
      );
      return;
    }

    let reason: string | null = null;

    if (
      group.hazard.required ||
      group.hazard.source === "Requirement"
    ) {
      const confirmed = window.confirm(
        "This hazard is supported by an applicable requirement. Remove it from the active PTP only if it does not apply to this work step.",
      );

      if (!confirmed) {
        return;
      }

      const enteredReason = window.prompt(
        "Why does this requirement-backed hazard not apply to this work step?",
        "",
      );

      if (enteredReason === null) {
        return;
      }

      reason =
        enteredReason.trim() ||
        "Qualified user determined this requirement-backed hazard does not apply to the current work step.";
    } else {
      const confirmed = window.confirm(
        `Remove "${group.hazard.text}" from this work step? You can undo the removal immediately.`,
      );

      if (!confirmed) {
        return;
      }

      reason =
        group.hazard.source === "User"
          ? "Qualified user removed a user-authored draft hazard."
          : "Qualified user determined the generated hazard does not apply to this work step.";
    }

    const operationKey =
      `hazard-remove:${step.sequence}:${group.hazard.id}`;

    setHazardControlOverrideSavingId(
      group.hazard.id,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-overrides`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              operationKey,
              workStepId,
              workStepSequence:
                step.sequence,
              workStepTitle:
                step.title,
              itemType:
                "Hazard",
              action:
                "Remove",
              targetItemId:
                group.hazard.id,
              parentHazardId:
                null,
              originalText:
                group.hazard.text,
              finalText:
                null,
              canonicalHazardConceptId:
                null,
              sourceType:
                group.hazard.source,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                groupId:
                  group.id,
                sourceActivityCodes:
                  group.hazard.sourceActivityCodes,
                sourceQuestionCodes:
                  group.hazard.sourceQuestionCodes,
                sourceRequirementIds:
                  group.hazard.sourceRequirementIds,
                required:
                  group.hazard.required,
                removalDisposition:
                  group.hazard.required ||
                  group.hazard.source === "Requirement"
                    ? "RequirementBackedNotApplicable"
                    : group.hazard.source === "User"
                      ? "UserRemoved"
                      : "GeneratedNotApplicable",
              },
              reason,
              changedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              changedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          override?: HazardControlOverride;
          message?: string;
        };

      if (
        !response.ok ||
        !data.override
      ) {
        throw new Error(
          data.message ||
            "Unable to remove the hazard.",
        );
      }

      setHazardControlOverrides(
        (current) => [
          ...current.filter(
            (existing) =>
              existing.operationKey !==
              data.override!.operationKey,
          ),
          data.override!,
        ],
      );

      setLastRemovedHazard({
        operationKey,
        stepSequence:
          step.sequence,
        stepTitle:
          step.title,
        workStepId,
        hazardId:
          group.hazard.id,
        hazardText:
          group.hazard.text,
        sourceType:
          group.hazard.source,
        sourceActivityCodes:
          group.hazard.sourceActivityCodes,
        sourceQuestionCodes:
          group.hazard.sourceQuestionCodes,
        sourceRequirementIds:
          group.hazard.sourceRequirementIds,
        required:
          group.hazard.required,
        reason,
      });

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "The hazard removal was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
      }
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to remove the hazard.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  async function undoLastHazardRemoval() {
    if (
      !planningRecordId ||
      !lastRemovedHazard
    ) {
      return;
    }

    const undo =
      lastRemovedHazard;

    setHazardControlOverrideSavingId(
      undo.hazardId,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-overrides`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              operationKey:
                undo.operationKey,
              workStepId:
                undo.workStepId,
              workStepSequence:
                undo.stepSequence,
              workStepTitle:
                undo.stepTitle,
              itemType:
                "Hazard",
              action:
                "Edit",
              targetItemId:
                undo.hazardId,
              parentHazardId:
                null,
              originalText:
                undo.hazardText,
              finalText:
                undo.hazardText,
              canonicalHazardConceptId:
                null,
              sourceType:
                undo.sourceType,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                sourceActivityCodes:
                  undo.sourceActivityCodes,
                sourceQuestionCodes:
                  undo.sourceQuestionCodes,
                sourceRequirementIds:
                  undo.sourceRequirementIds,
                required:
                  undo.required,
                undoOfRemoval:
                  true,
                priorRemovalReason:
                  undo.reason,
              },
              reason:
                "Qualified user restored a previously removed hazard.",
              changedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              changedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          override?: HazardControlOverride;
          message?: string;
        };

      if (
        !response.ok ||
        !data.override
      ) {
        throw new Error(
          data.message ||
            "Unable to restore the hazard.",
        );
      }

      setHazardControlOverrides(
        (current) => [
          ...current.filter(
            (existing) =>
              existing.operationKey !==
              data.override!.operationKey,
          ),
          data.override!,
        ],
      );

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "The hazard restore was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      setLastRemovedHazard(null);
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to restore the hazard.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  async function restoreRemovedHazard(
    override: HazardControlOverride,
  ) {
    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before a removed hazard can be restored.",
      );
      return;
    }

    if (
      override.itemType !== "Hazard" ||
      override.action !== "Remove" ||
      !override.targetItemId ||
      !override.originalText?.trim()
    ) {
      setHazardControlOverrideError(
        "Qoreva could not identify the removed hazard to restore. Refresh the planning record and try again.",
      );
      return;
    }

    const existingMetadata =
      typeof override.sourceMetadata === "object" &&
      override.sourceMetadata !== null &&
      !Array.isArray(override.sourceMetadata)
        ? (override.sourceMetadata as Record<
            string,
            unknown
          >)
        : {};

    setHazardControlOverrideSavingId(
      override.targetItemId,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-overrides`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              operationKey:
                override.operationKey,
              workStepId:
                override.workStepId,
              workStepSequence:
                override.workStepSequence,
              workStepTitle:
                override.workStepTitle,
              itemType: "Hazard",
              action: "Edit",
              targetItemId:
                override.targetItemId,
              parentHazardId: null,
              originalText:
                override.originalText,
              finalText:
                override.originalText,
              canonicalHazardConceptId:
                override.canonicalHazardConceptId,
              sourceType:
                override.sourceType,
              sourceMetadata: {
                ...existingMetadata,
                revisionNumber:
                  planningRevisionNumber,
                restoredFromRemovedHazards:
                  true,
                priorRemovalReason:
                  override.reason,
              },
              reason:
                "Qualified user restored a previously removed hazard from Removed Hazards.",
              changedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              changedByRole:
                reviewerRole.trim() ||
                (responsibleSupervisor.trim()
                  ? "Responsible Supervisor / Foreman"
                  : null),
            }),
          },
        );

      const data =
        (await response.json()) as {
          override?: HazardControlOverride;
          message?: string;
        };

      if (
        !response.ok ||
        !data.override
      ) {
        throw new Error(
          data.message ||
            "Unable to restore the removed hazard.",
        );
      }

      setHazardControlOverrides(
        (current) => [
          ...current.filter(
            (existing) =>
              existing.operationKey !==
              data.override!.operationKey,
          ),
          data.override!,
        ],
      );

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "The hazard was restored, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      if (
        lastRemovedHazard?.operationKey ===
        override.operationKey
      ) {
        setLastRemovedHazard(null);
      }
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to restore the removed hazard.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  function openAddControlEditor(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
  ) {
    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before adding a control.",
      );
      return;
    }

    setActiveControlEditor({
      operationKey:
        `control-add:${step.sequence}:${group.hazard.id}:${Date.now()}`,
      mode: "Add",
      stepSequence:
        step.sequence,
      stepTitle:
        step.title,
      workStepId,
      parentHazardId:
        group.hazard.id,
      parentHazardText:
        group.hazard.text,
      controlId: null,
      originalText: null,
      sourceType: "User",
      sourceActivityCodes: [],
      sourceQuestionCodes: [],
      sourceRequirementIds: [],
      required: false,
    });

    setControlEditorText("");
    setActiveRecommendedControls(null);
    setSelectedRecommendedControlIds([]);
    setRecommendedControlsError("");
    setHazardControlOverrideError("");
    setStepError("");
  }

  function closeRecommendedControls() {
    setActiveRecommendedControls(null);
    setSelectedRecommendedControlIds([]);
    setRecommendedControlsError("");
  }

  function toggleRecommendedControl(
    recommendationId: string,
  ) {
    setSelectedRecommendedControlIds(
      (current) =>
        current.includes(recommendationId)
          ? current.filter(
              (id) =>
                id !== recommendationId,
            )
          : [
              ...current,
              recommendationId,
            ],
    );

    setRecommendedControlsError("");
  }

  async function generateRecommendedControls(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
  ) {
    if (!planningRecordId) {
      setRecommendedControlsError(
        "The planning record must be saved before Qoreva can recommend controls.",
      );
      return;
    }

    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setRecommendedControlsError(
        "Qoreva could not reconnect this work step to the saved planning record. Refresh the draft and try again.",
      );
      return;
    }

    const requestKey =
      `${step.sequence}:${group.hazard.id}`;

    setRecommendedControlsLoadingKey(requestKey);
    setRecommendedControlsError("");
    setStepError("");

    try {
      const applicableActivityCodes =
        Array.from(
          new Set([
            ...confirmedActivityCodes,
            ...step.sourceActivityCodes,
            ...group.hazard.sourceActivityCodes,
          ]),
        );

      const response =
        await fetch(
          `/api/planning/${planningRecordId}/recommended-controls`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              hazardId:
                group.hazard.id,
              hazardText:
                group.hazard.text,
              workStepId,
              workStepTitle:
                step.title,
              applicableActivityCodes,
              existingControls:
                group.controls.map(
                  (control) =>
                    control.text,
                ),
            }),
          },
        );

      const data =
        (await response.json()) as
          RecommendedControlsResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to generate recommended controls.",
        );
      }

      if (
        data.revisionNumber !== undefined &&
        data.revisionNumber !==
          planningRevisionNumber
      ) {
        throw new Error(
          "The recommended controls do not match the active planning revision. Refresh and try again.",
        );
      }

      setActiveRecommendedControls({
        key: requestKey,
        stepSequence:
          step.sequence,
        stepTitle:
          step.title,
        workStepId,
        hazardId:
          group.hazard.id,
        hazardText:
          group.hazard.text,
        response:
          data,
      });

      setSelectedRecommendedControlIds([]);
    } catch (error) {
      setActiveRecommendedControls(null);
      setSelectedRecommendedControlIds([]);
      setRecommendedControlsError(
        error instanceof Error
          ? error.message
          : "Unable to generate recommended controls.",
      );
    } finally {
      setRecommendedControlsLoadingKey(null);
    }
  }

  async function addSelectedRecommendedControls() {
    if (
      !planningRecordId ||
      !activeRecommendedControls
    ) {
      return;
    }

    const recommendations =
      activeRecommendedControls.response.recommendations ?? [];

    const selected =
      recommendations.filter(
        (recommendation) =>
          selectedRecommendedControlIds.includes(
            recommendation.id,
          ),
      );

    if (selected.length === 0) {
      setRecommendedControlsError(
        "Select at least one recommended control before adding it.",
      );
      return;
    }

    setRecommendedControlsSaving(true);
    setRecommendedControlsError("");
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const persistedOverrides:
        HazardControlOverride[] = [];

      for (const recommendation of selected) {
        const response =
          await fetch(
            `/api/planning/${planningRecordId}/hazard-control-overrides`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                operationKey:
                  `recommended-control-add:${activeRecommendedControls.stepSequence}:${activeRecommendedControls.hazardId}:${recommendation.id}`,
                workStepId:
                  activeRecommendedControls.workStepId,
                workStepSequence:
                  activeRecommendedControls.stepSequence,
                workStepTitle:
                  activeRecommendedControls.stepTitle,
                itemType:
                  "Control",
                action:
                  "Add",
                targetItemId:
                  null,
                parentHazardId:
                  activeRecommendedControls.hazardId,
                originalText:
                  null,
                finalText:
                  recommendation.text,
                canonicalHazardConceptId:
                  recommendation.canonicalHazardConceptId,
                sourceType:
                  recommendation.source,
                sourceMetadata: {
                  revisionNumber:
                    planningRevisionNumber,
                  recommendationId:
                    recommendation.id,
                  recommendationSource:
                    activeRecommendedControls.response.metadata
                      ?.recommendationSource ??
                    "CanonicalHazardControlLibrary",
                  recommendationEngineVersion:
                    activeRecommendedControls.response.metadata
                      ?.recommendationEngineVersion ??
                    "qoreva-canonical-control-recommendations-v1",
                  canonicalHazardConceptId:
                    recommendation.canonicalHazardConceptId,
                  canonicalHazardLabel:
                    recommendation.canonicalHazardLabel,
                  riskAttention:
                    recommendation.riskAttention,
                  recommendationReason:
                    recommendation.recommendationReason,
                  parentHazardText:
                    activeRecommendedControls.hazardText,
                  sourceActivityCodes:
                    recommendation.sourceActivityCodes,
                  sourceQuestionCodes:
                    recommendation.sourceQuestionCodes,
                  sourceRequirementIds:
                    recommendation.sourceRequirementIds,
                  required:
                    recommendation.required,
                  selectedByQualifiedUser:
                    true,
                },
                reason:
                  "Qualified user selected this Qoreva recommended control.",
                changedByName:
                  reviewerName.trim() ||
                  responsibleSupervisor.trim() ||
                  null,
                changedByRole:
                  reviewerRole.trim() ||
                  (
                    responsibleSupervisor.trim()
                      ? "Responsible Supervisor / Foreman"
                      : null
                  ),
              }),
            },
          );

        const data =
          (await response.json()) as {
            override?: HazardControlOverride;
            message?: string;
          };

        if (
          !response.ok ||
          !data.override
        ) {
          throw new Error(
            data.message ||
              `Unable to add the selected control: ${recommendation.text}`,
          );
        }

        persistedOverrides.push(data.override);
      }

      setHazardControlOverrides(
        (current) => {
          const keys =
            new Set(
              persistedOverrides.map(
                (override) =>
                  override.operationKey,
              ),
            );

          return [
            ...current.filter(
              (existing) =>
                !keys.has(
                  existing.operationKey,
                ),
            ),
            ...persistedOverrides,
          ];
        },
      );

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setRecommendedControlsError(
          "The selected controls were saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      closeRecommendedControls();
    } catch (error) {
      setRecommendedControlsError(
        error instanceof Error
          ? error.message
          : "Unable to add the selected recommended controls.",
      );
    } finally {
      setRecommendedControlsSaving(false);
    }
  }

  function openEditControlEditor(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
    control: GeneratedHazardControlItem,
  ) {
    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before editing the control.",
      );
      return;
    }

    setActiveControlEditor({
      operationKey:
        `control-edit:${step.sequence}:${control.id}`,
      mode: "Edit",
      stepSequence:
        step.sequence,
      stepTitle:
        step.title,
      workStepId,
      parentHazardId:
        group.hazard.id,
      parentHazardText:
        group.hazard.text,
      controlId:
        control.id,
      originalText:
        control.text,
      sourceType:
        control.source,
      sourceActivityCodes:
        control.sourceActivityCodes,
      sourceQuestionCodes:
        control.sourceQuestionCodes,
      sourceRequirementIds:
        control.sourceRequirementIds,
      required:
        control.required,
    });

    setControlEditorText(
      control.text,
    );
    setHazardControlOverrideError("");
    setStepError("");
  }

  function cancelControlEditor() {
    setActiveControlEditor(null);
    setControlEditorText("");
    setHazardControlOverrideError("");
  }

  async function saveControlOverride() {
    if (!activeControlEditor) {
      return;
    }

    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before controls can be changed.",
      );
      return;
    }

    const finalText =
      controlEditorText.trim();

    if (!finalText) {
      setHazardControlOverrideError(
        activeControlEditor.mode ===
          "Add"
          ? "Enter the control to add."
          : "Enter the final control wording before saving.",
      );
      return;
    }

    if (
      activeControlEditor.mode ===
        "Edit" &&
      finalText ===
        activeControlEditor.originalText
          ?.trim()
    ) {
      cancelControlEditor();
      return;
    }

    const savingId =
      activeControlEditor.controlId ??
      activeControlEditor.operationKey;

    setHazardControlOverrideSavingId(
      savingId,
    );
    setHazardControlOverrideError("");
    setHazardControlDecisionError("");
    setStepError("");

    try {
      /*
       * IMPORTANT PRECEDENCE RULE
       *
       * Existing Qoreva/generated controls are recommendations
       * and therefore remain in the decision layer.
       *
       * Editing one must update the same revision-scoped
       * recommendation decision to Modify. This intentionally
       * supersedes an earlier NotApplicable decision for the
       * same recommendationId.
       *
       * User-authored controls created through + Add Control
       * remain in the override layer and are edited there.
       */
      const isGeneratedControlEdit =
        activeControlEditor.mode ===
          "Edit" &&
        activeControlEditor.sourceType !==
          "User";

      if (isGeneratedControlEdit) {
        if (!activeControlEditor.controlId) {
          throw new Error(
            "Qoreva could not identify the generated control being edited.",
          );
        }

        const response =
          await fetch(
            `/api/planning/${planningRecordId}/hazard-control-decisions`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                recommendationId:
                  activeControlEditor.controlId,
                itemType:
                  "Control",
                originalText:
                  activeControlEditor.originalText,
                decision:
                  "Modify",
                modifiedText:
                  finalText,
                targetHazardId:
                  activeControlEditor.parentHazardId,
                canonicalHazardConceptId:
                  null,
                sourceType:
                  activeControlEditor.sourceType,
                sourceMetadata: {
                  revisionNumber:
                    planningRevisionNumber,
                  stepSequence:
                    activeControlEditor.stepSequence,
                  stepTitle:
                    activeControlEditor.stepTitle,
                  parentHazardId:
                    activeControlEditor.parentHazardId,
                  parentHazardText:
                    activeControlEditor.parentHazardText,
                  sourceActivityCodes:
                    activeControlEditor
                      .sourceActivityCodes,
                  sourceQuestionCodes:
                    activeControlEditor
                      .sourceQuestionCodes,
                  sourceRequirementIds:
                    activeControlEditor
                      .sourceRequirementIds,
                  required:
                    activeControlEditor.required,
                  previousDecisionMayBeSuperseded:
                    true,
                },
                decidedByName:
                  reviewerName.trim() ||
                  responsibleSupervisor.trim() ||
                  null,
                decidedByRole:
                  reviewerRole.trim() ||
                  (
                    responsibleSupervisor.trim()
                      ? "Responsible Supervisor / Foreman"
                      : null
                  ),
              }),
            },
          );

        const data =
          (await response.json()) as {
            decision?: HazardControlDecision;
            message?: string;
          };

        if (
          !response.ok ||
          !data.decision
        ) {
          throw new Error(
            data.message ||
              "Unable to save the modified control.",
          );
        }

        setHazardControlDecisions(
          (current) => [
            ...current.filter(
              (existing) =>
                existing.recommendationId !==
                data.decision!
                  .recommendationId,
            ),
            data.decision!,
          ],
        );
      } else {
        const response =
          await fetch(
            `/api/planning/${planningRecordId}/hazard-control-overrides`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                operationKey:
                  activeControlEditor.operationKey,
                workStepId:
                  activeControlEditor.workStepId,
                workStepSequence:
                  activeControlEditor.stepSequence,
                workStepTitle:
                  activeControlEditor.stepTitle,
                itemType:
                  "Control",
                action:
                  activeControlEditor.mode,
                targetItemId:
                  activeControlEditor.mode ===
                    "Add"
                    ? null
                    : activeControlEditor.controlId,
                parentHazardId:
                  activeControlEditor.parentHazardId,
                originalText:
                  activeControlEditor.mode ===
                    "Add"
                    ? null
                    : activeControlEditor.originalText,
                finalText,
                canonicalHazardConceptId:
                  null,
                sourceType:
                  activeControlEditor.mode ===
                    "Add"
                    ? "User"
                    : activeControlEditor.sourceType,
                sourceMetadata: {
                  revisionNumber:
                    planningRevisionNumber,
                  parentHazardText:
                    activeControlEditor.parentHazardText,
                  sourceActivityCodes:
                    activeControlEditor
                      .sourceActivityCodes,
                  sourceQuestionCodes:
                    activeControlEditor
                      .sourceQuestionCodes,
                  sourceRequirementIds:
                    activeControlEditor
                      .sourceRequirementIds,
                  required:
                    activeControlEditor.required,
                  editMode:
                    activeControlEditor.mode,
                },
                reason: null,
                changedByName:
                  reviewerName.trim() ||
                  responsibleSupervisor.trim() ||
                  null,
                changedByRole:
                  reviewerRole.trim() ||
                  (
                    responsibleSupervisor.trim()
                      ? "Responsible Supervisor / Foreman"
                      : null
                  ),
              }),
            },
          );

        const data =
          (await response.json()) as {
            override?: HazardControlOverride;
            message?: string;
          };

        if (
          !response.ok ||
          !data.override
        ) {
          throw new Error(
            data.message ||
              "Unable to save the control change.",
          );
        }
      }

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "Your control change was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      cancelControlEditor();
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to save the control change.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  async function removeUserControl(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
    control: GeneratedHazardControlItem,
  ) {
    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before controls can be removed.",
      );
      return;
    }

    if (
      control.source !== "User" ||
      control.required
    ) {
      setHazardControlOverrideError(
        "Only user-authored, non-required controls can be removed. Generated or requirement-backed controls use Not Applicable so the audit trail is preserved.",
      );
      return;
    }

    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before removing the control.",
      );
      return;
    }

    const operationKey =
      `control-remove:${step.sequence}:${control.id}`;

    setHazardControlOverrideSavingId(
      control.id,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-overrides`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              operationKey,
              workStepId,
              workStepSequence:
                step.sequence,
              workStepTitle:
                step.title,
              itemType:
                "Control",
              action:
                "Remove",
              targetItemId:
                control.id,
              parentHazardId:
                group.hazard.id,
              originalText:
                control.text,
              finalText:
                null,
              canonicalHazardConceptId:
                null,
              sourceType:
                control.source,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                parentHazardText:
                  group.hazard.text,
                sourceActivityCodes:
                  control.sourceActivityCodes,
                sourceQuestionCodes:
                  control.sourceQuestionCodes,
                sourceRequirementIds:
                  control.sourceRequirementIds,
                required:
                  control.required,
              },
              reason:
                "Qualified user removed a user-authored draft control.",
              changedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              changedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          override?: HazardControlOverride;
          message?: string;
        };

      if (
        !response.ok ||
        !data.override
      ) {
        throw new Error(
          data.message ||
            "Unable to remove the user-authored control.",
        );
      }

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "The control removal was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
      }
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to remove the user-authored control.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  async function markVisibleControlNotApplicable(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
    control: GeneratedHazardControlItem,
  ) {
    if (!planningRecordId) {
      setHazardControlDecisionError(
        "The planning record must be saved before this control decision can be recorded.",
      );
      return;
    }

    if (
      control.source === "User" &&
      !control.required
    ) {
      setHazardControlDecisionError(
        "This is user-authored draft content. Use Remove for a control you no longer want in the plan; Not Applicable is reserved for generated or requirement-backed recommendations.",
      );
      return;
    }

    setHazardControlDecisionSavingId(
      control.id,
    );
    setHazardControlDecisionError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-decisions`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              recommendationId:
                control.id,
              itemType:
                "Control",
              originalText:
                control.text,
              decision:
                "NotApplicable",
              modifiedText:
                null,
              targetHazardId:
                group.hazard.id,
              canonicalHazardConceptId:
                null,
              sourceType:
                control.source,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                stepSequence:
                  step.sequence,
                stepTitle:
                  step.title,
                parentHazardId:
                  group.hazard.id,
                parentHazardText:
                  group.hazard.text,
                sourceActivityCodes:
                  control.sourceActivityCodes,
                sourceQuestionCodes:
                  control.sourceQuestionCodes,
                sourceRequirementIds:
                  control.sourceRequirementIds,
                required:
                  control.required,
                requiresRequirementReview:
                  control.required,
              },
              decidedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              decidedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
                ),
            }),
          },
        );

      const data =
        (await response.json()) as {
          decision?: HazardControlDecision;
          message?: string;
        };

      if (
        !response.ok ||
        !data.decision
      ) {
        throw new Error(
          data.message ||
            "Unable to save the Not Applicable decision.",
        );
      }

      setHazardControlDecisions(
        (current) => [
          ...current.filter(
            (existing) =>
              existing.recommendationId !==
              data.decision!
                .recommendationId,
          ),
          data.decision!,
        ],
      );

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlDecisionError(
          "The Not Applicable decision was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
      }
    } catch (error) {
      setHazardControlDecisionError(
        error instanceof Error
          ? error.message
          : "Unable to save the Not Applicable decision.",
      );
    } finally {
      setHazardControlDecisionSavingId(
        null,
      );
    }
  }

  function isMaterialHandlingResolutionCandidate(
    hazardText: string,
  ) {
    const normalized =
      hazardText
        .trim()
        .toLowerCase();

    return (
      normalized ===
        "material handling" ||
      normalized.includes(
        "material handling",
      ) ||
      normalized ===
        "handling materials"
    );
  }

  function openHazardResolution(
    step: GeneratedDraftWorkStep,
    group: GeneratedHazardControlGroup,
  ) {
    const workStepId =
      findPersistedWorkStepId(
        step.sequence,
        step.title,
      );

    if (!workStepId) {
      setHazardControlOverrideError(
        "Qoreva could not reconnect this generated work step to the saved planning work step. Refresh the draft before resolving the hazard.",
      );
      return;
    }

    setActiveHazardResolution({
      operationKey:
        `hazard-resolve:${step.sequence}:${group.hazard.id}`,
      mode: "Change",
      stepSequence:
        step.sequence,
      stepTitle:
        step.title,
      workStepId,
      groupId:
        group.id,
      hazardId:
        group.hazard.id,
      originalText:
        group.hazard.text,
      sourceType:
        group.hazard.source,
      sourceActivityCodes:
        group.hazard.sourceActivityCodes,
      sourceQuestionCodes:
        group.hazard.sourceQuestionCodes,
      sourceRequirementIds:
        group.hazard.sourceRequirementIds,
      required:
        group.hazard.required,
    });

    setSelectedHazardResolutionIds(
      [],
    );
    setCustomHazardResolutionText("");
    setHazardControlOverrideError("");
    setStepError("");
  }

  function cancelHazardResolution() {
    setActiveHazardResolution(
      null,
    );
    setSelectedHazardResolutionIds(
      [],
    );
    setCustomHazardResolutionText("");
    setHazardControlOverrideError("");
  }

  function toggleHazardResolutionOption(
    optionId: string,
  ) {
    setSelectedHazardResolutionIds(
      (current) =>
        current.includes(optionId)
          ? current.filter(
              (id) =>
                id !== optionId,
            )
          : [
              ...current,
              optionId,
            ],
    );

    setHazardControlOverrideError("");
  }

  async function saveHazardResolution() {
    if (!activeHazardResolution) {
      return;
    }

    if (!planningRecordId) {
      setHazardControlOverrideError(
        "The planning record must be saved before the hazard can be resolved.",
      );
      return;
    }

    const selectedOptions =
      materialHandlingResolutionOptions.filter(
        (option) =>
          selectedHazardResolutionIds.includes(
            option.id,
          ),
      );

    const customText =
      customHazardResolutionText.trim();

    const resolvedHazards = [
      ...selectedOptions.map(
        (option) => ({
          key:
            option.id,
          text:
            option.hazardText,
        }),
      ),
      ...(customText
        ? [
            {
              key: "custom",
              text: customText,
            },
          ]
        : []),
    ];

    if (
      resolvedHazards.length === 0
    ) {
      setHazardControlOverrideError(
        "Select at least one hazard exposure or enter a custom hazard.",
      );
      return;
    }

    setHazardControlOverrideSavingId(
      activeHazardResolution.hazardId ??
        activeHazardResolution.operationKey,
    );
    setHazardControlOverrideError("");
    setStepError("");

    try {
      /*
       * The first selected exposure replaces the broad
       * hazard. Additional exposures are added as separate
       * hazards in the same work step.
       *
       * This preserves the original broad phrase in the
       * audit layer while preventing one vague hazard card
       * from accumulating unrelated controls.
       */
      for (
        let index = 0;
        index < resolvedHazards.length;
        index += 1
      ) {
        const resolvedHazard =
          resolvedHazards[index];

        const isPrimary =
          index === 0;

        const response =
          await fetch(
            `/api/planning/${planningRecordId}/hazard-control-overrides`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                operationKey:
                  isPrimary
                    ? `hazard-resolve-change:${activeHazardResolution.stepSequence}:${activeHazardResolution.hazardId}:${resolvedHazard.key}`
                    : `hazard-resolve-add:${activeHazardResolution.stepSequence}:${activeHazardResolution.hazardId}:${resolvedHazard.key}`,
                workStepId:
                  activeHazardResolution.workStepId,
                workStepSequence:
                  activeHazardResolution.stepSequence,
                workStepTitle:
                  activeHazardResolution.stepTitle,
                itemType:
                  "Hazard",
                action:
                  isPrimary
                    ? "Change"
                    : "Add",
                targetItemId:
                  isPrimary
                    ? activeHazardResolution.hazardId
                    : null,
                parentHazardId:
                  null,
                originalText:
                  isPrimary
                    ? activeHazardResolution.originalText
                    : null,
                finalText:
                  resolvedHazard.text,
                canonicalHazardConceptId:
                  null,
                sourceType:
                  isPrimary
                    ? activeHazardResolution.sourceType
                    : "User",
                sourceMetadata: {
                  revisionNumber:
                    planningRevisionNumber,
                  groupId:
                    activeHazardResolution.groupId,
                  sourceActivityCodes:
                    activeHazardResolution.sourceActivityCodes,
                  sourceQuestionCodes:
                    activeHazardResolution.sourceQuestionCodes,
                  sourceRequirementIds:
                    activeHazardResolution.sourceRequirementIds,
                  required:
                    activeHazardResolution.required,
                  resolutionType:
                    "MaterialHandlingClarification",
                  originalBroadHazard:
                    activeHazardResolution.originalText,
                  selectedResolutionKey:
                    resolvedHazard.key,
                },
                reason:
                  "Qualified user clarified a broad material-handling hazard into the actual field exposure.",
                changedByName:
                  reviewerName.trim() ||
                  responsibleSupervisor.trim() ||
                  null,
                changedByRole:
                  reviewerRole.trim() ||
                  (
                    responsibleSupervisor.trim()
                      ? "Responsible Supervisor / Foreman"
                      : null
                  ),
              }),
            },
          );

        const data =
          (await response.json()) as {
            override?: HazardControlOverride;
            message?: string;
          };

        if (
          !response.ok ||
          !data.override
        ) {
          throw new Error(
            data.message ||
              "Unable to save the resolved hazard.",
          );
        }
      }

      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlOverrideError(
          "The hazard resolution was saved, but Qoreva could not refresh the draft automatically. Use Refresh Draft Plan before continuing.",
        );
        return;
      }

      cancelHazardResolution();
    } catch (error) {
      setHazardControlOverrideError(
        error instanceof Error
          ? error.message
          : "Unable to save the hazard resolution.",
      );
    } finally {
      setHazardControlOverrideSavingId(
        null,
      );
    }
  }

  function openHazardControlReview(
    item: UnassignedUserControlReviewItem,
    mode: HazardControlReviewMode,
  ) {
    setActiveHazardControlReviewId(
      item.id,
    );
    setHazardControlReviewMode(
      mode,
    );
    setSelectedTargetHazardId("");
    setModifiedControlText(
      mode === "Modify"
        ? item.control.text
        : "",
    );
    setHazardControlDecisionError("");
    setStepError("");
  }

  function cancelHazardControlReview() {
    setActiveHazardControlReviewId(null);
    setHazardControlReviewMode(null);
    setSelectedTargetHazardId("");
    setModifiedControlText("");
    setHazardControlDecisionError("");
  }

  async function saveHazardControlDecision(
    item: UnassignedUserControlReviewItem,
    decision: HazardControlDecisionValue,
  ) {
    if (!planningRecordId) {
      setHazardControlDecisionError(
        "The planning record must be saved before this review decision can be recorded.",
      );
      return;
    }

    if (
      decision === "Assign" &&
      !selectedTargetHazardId
    ) {
      setHazardControlDecisionError(
        "Select the hazard this control mitigates.",
      );
      return;
    }

    if (
      decision === "Modify" &&
      !modifiedControlText.trim()
    ) {
      setHazardControlDecisionError(
        "Enter the revised control text before saving.",
      );
      return;
    }

    const selectedTargetHazard =
      item.targetHazards.find(
        (hazard) =>
          hazard.id ===
          selectedTargetHazardId,
      ) ?? null;

    setHazardControlDecisionSavingId(
      item.id,
    );
    setHazardControlDecisionError("");
    setStepError("");

    try {
      const response =
        await fetch(
          `/api/planning/${planningRecordId}/hazard-control-decisions`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              recommendationId:
                item.control.id,
              itemType:
                "Control",
              originalText:
                item.control.text,
              decision,
              modifiedText:
                decision === "Modify"
                  ? modifiedControlText.trim()
                  : null,
              targetHazardId:
                decision === "Assign"
                  ? selectedTargetHazardId
                  : null,
              canonicalHazardConceptId:
                null,
              sourceType:
                item.control.source,
              sourceMetadata: {
                revisionNumber:
                  planningRevisionNumber,
                stepSequence:
                  item.stepSequence,
                stepTitle:
                  item.stepTitle,
                sourceActivityCodes:
                  item.control
                    .sourceActivityCodes,
                sourceQuestionCodes:
                  item.control
                    .sourceQuestionCodes,
                sourceRequirementIds:
                  item.control
                    .sourceRequirementIds,
                required:
                  item.control.required,
                targetHazardText:
                  selectedTargetHazard
                    ?.text ?? null,
              },
              decidedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,
              decidedByRole:
                reviewerRole.trim() ||
                (responsibleSupervisor.trim()
                  ? "Responsible Supervisor / Foreman"
                  : null),
            }),
          },
        );

      const data =
        (await response.json()) as {
          decision?: HazardControlDecision;
          message?: string;
        };

      if (
        !response.ok ||
        !data.decision
      ) {
        throw new Error(
          data.message ||
            "Unable to save the hazard/control review decision.",
        );
      }

      setHazardControlDecisions(
        (current) => [
          ...current.filter(
            (existing) =>
              existing.recommendationId !==
              data.decision!
                .recommendationId,
          ),
          data.decision!,
        ],
      );

      /*
       * A hazard/control decision changes the authoritative inputs
       * consumed by the Qoreva draft generator. Refresh the generated
       * draft immediately so Step 6 never shows a stale review count
       * or requires the field user to manually click Regenerate Draft.
       *
       * The decision is already persisted before this runs, so the
       * server-side generator reads the newly saved decision from the
       * Planning generation context.
       */
      const draftSynchronized =
        await generateDraftPlan();

      if (!draftSynchronized) {
        setHazardControlDecisionError(
          "Your review decision was saved, but Qoreva could not refresh the draft automatically. Use Regenerate Draft before continuing.",
        );
        return;
      }

      cancelHazardControlReview();
    } catch (error) {
      setHazardControlDecisionError(
        error instanceof Error
          ? error.message
          : "Unable to save the hazard/control review decision.",
      );
    } finally {
      setHazardControlDecisionSavingId(
        null,
      );
    }
  }

  function continueFromBuildPlan() {
    if (!draftGenerated) {
      setStepError(
        "Generate and save the draft plan before continuing to pre-submission review.",
      );
      return;
    }

    if (
      unassignedUserControlReviewItems.length >
      0
    ) {
      setStepError(
        `Resolve the ${unassignedUserControlReviewItems.length} control${
          unassignedUserControlReviewItems.length ===
          1
            ? ""
            : "s"
        } that still need a hazard/control review decision before continuing.`,
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

  useEffect(() => {
    setHighestReachedStep((current) =>
      Math.max(
        current,
        currentStep,
      ),
    );
  }, [currentStep]);

  function returnToStep(
    step: number,
  ) {
    if (
      step < 1 ||
      step > highestReachedStep
    ) {
      return;
    }

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
          "Pre-Submission Reviewer",
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

  function mapResolvedApprovalRolesToSignatures(
    roles: ResolvedPlanningApprovalRole[],
  ): SubmissionSignature[] {
    return roles.map(
      (role) => ({
        id:
          `routing-${role.code}`,

        role:
          role.label,

        signerId:
          role.signerId,

        signerName:
          role.signerName ?? "",

        signerEmail:
          role.signerEmail,

        required:
          role.required,

        status:
          "Pending",

        signedAt:
          null,

        signatureDataUrl:
          null,
      }),
    );
  }

  async function loadApprovalEligibility(
    activePlanningRecordId: string,
  ) {
    setApprovalEligibilityLoading(
      true,
    );

    setApprovalEligibilityError("");

    try {
      const response =
        await fetch(
          `/api/planning/${activePlanningRecordId}/approval-eligible-users`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as
          PlanningApprovalEligibilityResponse;

      if (
        !response.ok ||
        !data.planningRecord ||
        !data.roles
      ) {
        throw new Error(
          data.message ||
            "Unable to load eligible approval reviewers.",
        );
      }

      if (
        data.planningRecord
          .revisionNumber !==
        planningRevisionNumber
      ) {
        throw new Error(
          "Reviewer eligibility does not match the active planning revision.",
        );
      }

      const nextAssignments:
        PlanningApprovalAssignments =
        {};

      const nextConfirmations:
        PlanningApprovalAssignmentConfirmations =
        {};

      for (
        const role of
        data.roles
      ) {
        const roleCode =
          normalizeApprovalRoleCode(
            role.roleCode,
          );

        const currentUserId =
          approvalAssignments[
            roleCode
          ];

        const currentStillEligible =
          Boolean(
            currentUserId &&
            role.eligibleUsers.some(
              (user) =>
                user.userId ===
                currentUserId,
            ),
          );

        if (
          currentStillEligible &&
          currentUserId
        ) {
          nextAssignments[
            roleCode
          ] =
            currentUserId;

          nextConfirmations[
            roleCode
          ] =
            approvalAssignmentConfirmations[
              roleCode
            ] === true;

          continue;
        }

        const configuredUserId =
          role.configuredSigner
            .userId;

        const configuredEligible =
          Boolean(
            configuredUserId &&
            role.eligibleUsers.some(
              (user) =>
                user.userId ===
                configuredUserId,
            ),
          );

        if (
          configuredEligible &&
          configuredUserId
        ) {
          nextAssignments[
            roleCode
          ] =
            configuredUserId;

          /*
           * Qoreva can suggest an assigned identity,
           * but the creator must still confirm it.
           */
          nextConfirmations[
            roleCode
          ] = false;

          continue;
        }

        if (
          role.eligibleUsers
            .length === 1
        ) {
          nextAssignments[
            roleCode
          ] =
            role.eligibleUsers[0]
              .userId;

          /*
           * Single eligible person is preselected
           * to reduce clicks, but is not silently
           * accepted as an official assignment.
           */
          nextConfirmations[
            roleCode
          ] = false;

          continue;
        }

        nextConfirmations[
          roleCode
        ] = false;
      }

      setApprovalEligibility(
        data,
      );

      setApprovalAssignments(
        nextAssignments,
      );

      setApprovalAssignmentConfirmations(
        nextConfirmations,
      );

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load eligible approval reviewers.";

      setApprovalEligibility(
        null,
      );

      setApprovalEligibilityError(
        message,
      );

      throw error;
    } finally {
      setApprovalEligibilityLoading(
        false,
      );
    }
  }

  function changeApprovalAssignment(
    roleCode: string,
    userId: string,
  ) {
    const normalizedRoleCode =
      normalizeApprovalRoleCode(
        roleCode,
      );

    setApprovalAssignments(
      (current) => ({
        ...current,
        [normalizedRoleCode]:
          userId,
      }),
    );

    /*
     * A changed person must always be
     * reconfirmed before submission.
     */
    setApprovalAssignmentConfirmations(
      (current) => ({
        ...current,
        [normalizedRoleCode]:
          false,
      }),
    );

    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  function confirmApprovalAssignment(
    roleCode: string,
  ) {
    const normalizedRoleCode =
      normalizeApprovalRoleCode(
        roleCode,
      );

    const selectedUserId =
      approvalAssignments[
        normalizedRoleCode
      ];

    if (!selectedUserId) {
      setStepError(
        "Select an eligible person before confirming this approval assignment.",
      );

      return;
    }

    setApprovalAssignmentConfirmations(
      (current) => ({
        ...current,
        [normalizedRoleCode]:
          true,
      }),
    );

    setSubmitted(false);
    setSubmittedAt(null);
    setStepError("");
  }

  async function loadSubmissionReadiness(
    activePlanningRecordId: string,
  ) {
    setSubmissionReadinessLoading(
      true,
    );
    setSubmissionReadiness(
      null,
    );
    setSubmissionReadinessError("");

    try {
      const response =
        await fetch(
          `/api/planning/${activePlanningRecordId}/submission-readiness`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as
          PlanningSubmissionReadinessResponse;

      if (
        !response.ok ||
        !data.readiness
      ) {
        throw new Error(
          data.message ||
            "Unable to load submission readiness.",
        );
      }

      setSubmissionReadiness(
        data.readiness,
      );

      return data.readiness;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load submission readiness.";

      setSubmissionReadiness(
        null,
      );

      setSubmissionReadinessError(
        message,
      );

      throw error;
    } finally {
      setSubmissionReadinessLoading(
        false,
      );
    }
  }

  async function loadApprovalRouting(
    activePlanningRecordId: string,
  ) {
    setApprovalRoutingLoading(
      true,
    );

    setApprovalRoutingError("");

    try {
      const response =
        await fetch(
          `/api/planning/${activePlanningRecordId}/approval-routing`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as
          PlanningApprovalRoutingResponse;

      if (
        !response.ok ||
        !data.routing
      ) {
        throw new Error(
          data.message ||
            "Unable to load approval routing.",
        );
      }

      if (
        data.routing.revisionNumber !==
        planningRevisionNumber
      ) {
        throw new Error(
          "Approval routing does not match the active planning revision.",
        );
      }

      if (
        data.routing.roles.length ===
        0
      ) {
        throw new Error(
          "No approval roles were resolved for this planning record.",
        );
      }

      const resolvedSignatures =
        mapResolvedApprovalRolesToSignatures(
          data.routing.roles,
        );

      /*
       * Keep the existing lightweight route representation
       * because other Step 8 metrics still consume it.
       *
       * Actual person assignment now comes from the dedicated
       * eligibility API below.
       */
      setSubmissionSignatures(
        resolvedSignatures,
      );

      await loadApprovalEligibility(
        activePlanningRecordId,
      );

      return resolvedSignatures;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load approval routing.";

      setApprovalRoutingError(
        message,
      );

      throw error;
    } finally {
      setApprovalRoutingLoading(
        false,
      );
    }
  }

  useEffect(() => {
    if (
      currentStep !== 8 ||
      !planningRecordId ||
      submissionReadiness ||
      submissionReadinessLoading ||
      submissionReadinessError
    ) {
      return;
    }

    void loadSubmissionReadiness(
      planningRecordId,
    ).catch(() => {
      /*
       * Step 8 remains available when the readiness
       * preview cannot load. Submission is still
       * authoritatively validated by the server.
       */
    });
  }, [
    currentStep,
    planningRecordId,
    submissionReadiness,
    submissionReadinessLoading,
    submissionReadinessError,
  ]);

  async function continueFromQualifiedReview() {
    if (!reviewerName.trim()) {
      setStepError(
        "Enter the name of the person completing the pre-submission review before continuing.",
      );
      return;
    }

    if (!reviewerRole.trim()) {
      setStepError(
        "Enter the pre-submission reviewer's role or title before continuing.",
      );
      return;
    }

    if (!generatedPlanningDraft) {
      setStepError(
        "The current Qoreva draft intelligence is not loaded. Return to Build Plan and regenerate the draft before completing pre-submission review.",
      );
      return;
    }

    const criticalGenerationFlags =
      generatedPlanningDraft.reviewFlags.filter(
        (flag) =>
          flag.severity === "Critical",
      );

    if (
      criticalGenerationFlags.length > 0
    ) {
      setStepError(
        `Resolve the critical Qoreva review item${
          criticalGenerationFlags.length === 1
            ? ""
            : "s"
        } before continuing to submission. ${criticalGenerationFlags.length} critical item${
          criticalGenerationFlags.length === 1
            ? ""
            : "s"
        } remain.`,
      );
      return;
    }

    if (unresolvedUserHazardReviewItems.length > 0) {
      setStepError(
        `Resolve the user-entered hazard${
          unresolvedUserHazardReviewItems.length === 1 ? "" : "s"
        } that still ${
          unresolvedUserHazardReviewItems.length === 1 ? "needs" : "need"
        } an assigned control before continuing. ${unresolvedUserHazardReviewItems.length} hazard${
          unresolvedUserHazardReviewItems.length === 1 ? "" : "s"
        } remain.`,
      );
      return;
    }

    if (unassignedUserControlReviewItems.length > 0) {
      setStepError(
        `Resolve the user-entered control${
          unassignedUserControlReviewItems.length === 1 ? "" : "s"
        } that still ${
          unassignedUserControlReviewItems.length === 1 ? "needs" : "need"
        } a hazard assignment before continuing. ${unassignedUserControlReviewItems.length} control${
          unassignedUserControlReviewItems.length === 1 ? "" : "s"
        } remain.`,
      );
      return;
    }

    const incompleteConfirmations =
      Object.entries(
        reviewConfirmations,
      ).filter(
        ([, confirmed]) =>
          !confirmed,
      );

    if (
      incompleteConfirmations.length > 0
    ) {
      setStepError(
        `Complete all pre-submission confirmations before continuing. ${incompleteConfirmations.length} item${
          incompleteConfirmations.length === 1
            ? ""
            : "s"
        } remain.`,
      );
      return;
    }

    if (
      planningQualitySummary.actionRequired >
      0
    ) {
      setStepError(
        "Resolve all Action Required planning quality items before continuing to submission.",
      );
      return;
    }

    if (
      reviewCommentSummary.open > 0
    ) {
      setStepError(
        `Resolve all open review comments before continuing to submission. ${reviewCommentSummary.open} open comment${
          reviewCommentSummary.open === 1
            ? ""
            : "s"
        } remain.`,
      );
      return;
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before completing pre-submission review.",
      );
      return;
    }

    if (!draftGenerated) {
      setStepError(
        "Generate and save the current draft revision before completing pre-submission review.",
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
                reviewNotes.trim() ||
                null,

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
            "Unable to persist the pre-submission review.",
        );
      }

      if (!data.review?.id) {
        throw new Error(
          "The pre-submission review was not confirmed as saved.",
        );
      }

      await loadApprovalRouting(
        planningRecordId,
      );

      try {
        await loadSubmissionReadiness(
          planningRecordId,
        );
      } catch {
        /*
         * Submission readiness is a preview for Step 8.
         * Do not prevent entry when the preview cannot load.
         * The authoritative submit endpoint recalculates
         * compliance before allowing submission.
         */
      }

      setSubmitted(false);
      setSubmittedAt(null);
      setSubmissionAcknowledged(
        false,
      );

      setCurrentStep(8);
    } catch (error) {
      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to persist the pre-submission review.",
      );
    } finally {
      setQualifiedReviewSaving(
        false,
      );
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

        signerId:
          null,

        signerName:
          additionalApproverName.trim(),

        signerEmail:
          null,

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
      reviewCommentSummary.open >
      0
    ) {
      setStepError(
        "Resolve all open revision comments before submitting the planning record for review.",
      );

      return;
    }

    if (
      !submissionAcknowledged
    ) {
      setStepError(
        "Confirm the submission acknowledgement before submitting the planning record for review.",
      );

      return;
    }

    if (!planningRecordId) {
      setStepError(
        "The planning draft has not been created yet. Return to Assignment and save the draft before submission.",
      );

      return;
    }

    if (
      approvalRoutingError
    ) {
      setStepError(
        "Approval routing must be resolved before this planning record can be submitted for review.",
      );

      return;
    }

    if (
      approvalEligibilityError
    ) {
      setStepError(
        "Reviewer eligibility must be resolved before this planning record can be submitted for review.",
      );

      return;
    }

    if (
      !approvalEligibility ||
      !approvalEligibility.roles
    ) {
      setStepError(
        "Eligible reviewers have not been loaded. Reload the approval workflow before submission.",
      );

      return;
    }

    const requiredRoles =
      approvalEligibility.roles.filter(
        (role) =>
          role.isRequired,
      );

    if (
      requiredRoles.length === 0
    ) {
      setStepError(
        "No required approval roles are configured for this planning record.",
      );

      return;
    }

    const unresolvedRequiredRole =
      requiredRoles.find(
        (role) => {
          const roleCode =
            normalizeApprovalRoleCode(
              role.roleCode,
            );

          return (
            !approvalAssignments[
              roleCode
            ] ||
            approvalAssignmentConfirmations[
              roleCode
            ] !== true
          );
        },
      );

    if (
      unresolvedRequiredRole
    ) {
      setStepError(
        `Confirm the ${unresolvedRequiredRole.roleLabel} assignment before submitting this planning record for review.`,
      );

      return;
    }

    const invalidSelectedUser =
      approvalEligibility.roles.find(
        (role) => {
          const roleCode =
            normalizeApprovalRoleCode(
              role.roleCode,
            );

          const userId =
            approvalAssignments[
              roleCode
            ];

          if (!userId) {
            return false;
          }

          return !role.eligibleUsers.some(
            (user) =>
              user.userId ===
              userId,
          );
        },
      );

    if (
      invalidSelectedUser
    ) {
      setStepError(
        `The selected ${invalidSelectedUser.roleLabel} is no longer eligible. Reload the approval workflow and choose an eligible person.`,
      );

      return;
    }

    const approvalAssignmentsPayload =
      approvalEligibility.roles
        .map((role) => {
          const roleCode =
            normalizeApprovalRoleCode(
              role.roleCode,
            );

          const userId =
            approvalAssignments[
              roleCode
            ];

          const confirmed =
            approvalAssignmentConfirmations[
              roleCode
            ] === true;

          if (
            !userId ||
            !confirmed
          ) {
            return null;
          }

          return {
            roleCode,
            userId,
          };
        })
        .filter(
          (
            assignment,
          ): assignment is {
            roleCode: string;
            userId: string;
          } =>
            assignment !==
            null,
        );

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

              approvalAssignments:
                approvalAssignmentsPayload,

              submittedByName:
                reviewerName.trim() ||
                responsibleSupervisor.trim() ||
                null,

              submittedByRole:
                reviewerRole.trim() ||
                (
                  responsibleSupervisor.trim()
                    ? "Responsible Supervisor / Foreman"
                    : null
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

          workflow?: {
            status?: string;

            approvals?: Array<{
              id: string;
              roleCode: string;
              roleLabel: string;
              isRequired: boolean;
              sortOrder: number;

              approverId:
                | string
                | null;

              approverName:
                | string
                | null;

              approverEmail:
                | string
                | null;

              status: string;
              signatureRequired:
                boolean;

              notificationStatus?:
                string | null;
            }>;
          };

          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit the planning record for review.",
        );
      }

      if (
        !data.record?.id ||
        data.record.status !==
          "Submitted"
      ) {
        throw new Error(
          "The planning record was not confirmed as submitted for review.",
        );
      }

      /*
       * Keep the current Step 8 route cards aligned with
       * the persisted server-side assignment snapshot.
       */
      if (
        data.workflow?.approvals
      ) {
        setSubmissionSignatures(
          data.workflow.approvals.map(
            (approval) => ({
              id:
                approval.id,

              role:
                approval.roleLabel,

              signerId:
                approval.approverId,

              signerName:
                approval.approverName ??
                "",

              signerEmail:
                approval.approverEmail,

              required:
                approval.isRequired,

              status:
                "Pending",

              signedAt:
                null,

              signatureDataUrl:
                null,
            }),
          ),
        );
      }

      setSubmitted(true);

      setSubmittedAt(
        data.record.submittedAt ??
          new Date().toISOString(),
      );

      /*
       * Submission completes within Step 8 rather than navigating to
       * a different wizard step, so explicitly return the user to the
       * top where the submitted-state confirmation is presented.
       */
      scrollPlanningPageToTop();
    } catch (error) {
      setSubmitted(false);
      setSubmittedAt(null);

      setStepError(
        error instanceof Error
          ? error.message
          : "Unable to submit the planning record for review.",
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
                  ? submitted
                    ? "Submitted Record"
                    : "Edit Revision"
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
                ? submitted
                  ? `Submitted Planning Revision ${planningRevisionNumber}`
                  : `Edit Planning Revision ${planningRevisionNumber}`
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
                ? submitted
                  ? "This submitted revision is an official record. Review the final package, pre-submission review history, signatures, and submission timestamp. Create a new revision to make changes."
                  : "Update the existing working revision without overwriting earlier submitted revision history. Regenerate the draft, complete pre-submission review, send it through the configured review/signature workflow, and resubmit this revision."
                : "Qoreva guides the planning process from work setup through requirements, hazards, controls, pre-submission review, configured approvals, and field readiness."}
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
                    : submitted
                      ? `Submitted Revision ${planningRevisionNumber}`
                      : `Editing Revision ${planningRevisionNumber}`}
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                {editModeError
                  ? editModeError
                  : submitted
                    ? "This submitted revision is read-only in the guided workflow. Its revision snapshot, pre-submission review, signatures, submission timestamp, and audit history remain preserved."
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
        currentStep={currentStep}
        highestReachedStep={
          highestReachedStep
        }
        onNavigate={returnToStep}
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
                        Add drawings, procedures, permits, equipment information, or other files that apply only to this plan. Uploaded files are saved directly to this Planning draft and retained as part of its source-document history.
                      </p>
                    </div>

                    <label
                      className={`mt-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] px-6 py-10 text-center transition ${
                        planSpecificUploadSaving
                          ? "cursor-wait opacity-70"
                          : "cursor-pointer hover:border-[rgba(102,87,232,0.32)] hover:bg-[var(--qoreva-violet-faint)]"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet-soft)] text-lg font-black text-[var(--qoreva-violet-dark)]">
                        +
                      </span>

                      <span className="mt-3 text-sm font-black text-[var(--qoreva-obsidian)]">
                        {planSpecificUploadSaving
                          ? "Saving supporting documents..."
                          : "Add supporting documents"}
                      </span>

                      <span className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                        PDF, JPG, JPEG, or PNG · Maximum 20 MB per file
                      </span>

                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        disabled={
                          planSpecificUploadSaving ||
                          !planningRecordId
                        }
                        className="sr-only"
                        onChange={(event) => {
                          const files =
                            Array.from(
                              event.target.files ??
                                [],
                            );

                          event.currentTarget.value =
                            "";

                          void uploadPlanSpecificDocuments(
                            files,
                          );
                        }}
                      />
                    </label>

                    {!planningRecordId ? (
                      <p className="mt-3 text-xs font-black text-[#9B6212]">
                        Save the Planning assignment before adding supporting documents.
                      </p>
                    ) : null}

                    {planSpecificUploadError ? (
                      <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)]">
                        {planSpecificUploadError}
                      </div>
                    ) : null}

                    {planSpecificDocuments.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {planSpecificDocuments.map(
                          (document) => (
                            <div
                              key={document.id}
                              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[var(--qoreva-obsidian)]">
                                  {document.fileName ||
                                    document.label ||
                                    "Supporting document"}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--qoreva-muted)]">
                                  <span>
                                    {document.fileSize !==
                                    null
                                      ? formatFileSize(
                                          document.fileSize,
                                        )
                                      : "Size unavailable"}
                                  </span>

                                  <span>
                                    ·
                                  </span>

                                  <span className="font-black text-[var(--qoreva-success)]">
                                    Saved to Draft
                                  </span>
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-success)]">
                                Source
                              </span>
                            </div>
                          ),
                        )}
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
                      When you continue, Qoreva analyzes the scope, equipment, materials, interfaces, conditions, and work sequence to suggest the activities that apply. You confirm the detected activities before they control the guided questions. Qoreva assists; qualified people remain responsible for the final planning and approval decisions.
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
                                High-risk work should receive additional verification during pre-submission review and the configured approval workflow before the plan becomes an official field record.
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
                      Answer the questions that apply. Requirement-driven questions identify why Qoreva is asking and let you review the applicable source without cluttering the field workflow.
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
                    Checking activities, answers, and applicable requirements...
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

                      const requirementSources =
                        question.requirementSources ?? [];

                      const hasRequirementSources =
                        requirementSources.length > 0;

                      const complianceResults =
                        planningCompliance?.results.filter(
                          (result) =>
                            result.questionCode ===
                            question.questionCode,
                        ) ?? [];

                      const unresolvedCompliance =
                        complianceResults.filter(
                          (result) =>
                            result.status ===
                            "Unresolved",
                        );

                      const requirementSourceLabels =
                        Array.from(
                          new Set(
                            requirementSources.map(
                              (source) =>
                                formatRequirementSourceLabel(
                                  source,
                                ),
                            ),
                          ),
                        );

                      return (
                        <article
                          key={question.id}
                          className={`rounded-2xl border p-4 ${
                            question.isCritical
                              ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)]"
                              : hasRequirementSources
                                ? "border-[rgba(102,87,232,0.22)] bg-[var(--qoreva-violet-faint)]"
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

                                {requirementSourceLabels.map(
                                  (label) => (
                                    <span
                                      key={`${question.id}-${label}`}
                                      className="rounded-full border border-[rgba(102,87,232,0.20)] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-violet-dark)]"
                                    >
                                      {label}
                                    </span>
                                  ),
                                )}
                              </div>

                              <h4 className="mt-1 font-black leading-6 text-[var(--qoreva-obsidian)]">
                                {question.questionText}
                              </h4>

                              {question.helpText ? (
                                <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                  {question.helpText}
                                </p>
                              ) : null}

                              {hasRequirementSources ? (
                                <details className="group mt-3 rounded-xl border border-[rgba(102,87,232,0.18)] bg-white">
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-black text-[var(--qoreva-violet-dark)] [&::-webkit-details-marker]:hidden">
                                    <span>
                                      Why Qoreva is asking
                                    </span>

                                    <span className="flex items-center gap-2 text-[10px] font-bold text-[var(--qoreva-muted)]">
                                      {requirementSources.length} source
                                      {requirementSources.length === 1
                                        ? ""
                                        : "s"}
                                      <span className="text-sm transition-transform group-open:rotate-180">
                                        ▾
                                      </span>
                                    </span>
                                  </summary>

                                  <div className="border-t border-[rgba(102,87,232,0.14)] p-3">
                                    <div className="grid gap-3">
                                      {requirementSources.map(
                                        (source) => {
                                          const sourceHeading =
                                            source.organizationName ||
                                            source.requirementPackName;

                                          const sourceLocation =
                                            [
                                              source.sourceDocumentName,
                                              source.sourcePage
                                                ? `Page ${source.sourcePage}`
                                                : null,
                                            ]
                                              .filter(Boolean)
                                              .join(" • ");

                                          return (
                                            <div
                                              key={source.requirementRuleId}
                                              className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3"
                                            >
                                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-violet)]">
                                                    {formatRequirementSourceLabel(
                                                      source,
                                                    )}
                                                  </p>

                                                  <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                                    {sourceHeading}
                                                  </p>
                                                </div>

                                                <span className="shrink-0 rounded-full border border-[var(--qoreva-border)] bg-white px-2 py-0.5 text-[9px] font-black text-[var(--qoreva-muted)]">
                                                  Version {source.version}
                                                </span>
                                              </div>

                                              <p className="mt-2 text-xs font-black leading-5 text-[var(--qoreva-obsidian)]">
                                                {source.title}
                                              </p>

                                              {source.requirementText ? (
                                                <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                  {source.requirementText}
                                                </p>
                                              ) : null}

                                              {sourceLocation ? (
                                                <p className="mt-2 text-[10px] font-bold leading-4 text-[var(--qoreva-subtle)]">
                                                  Source: {sourceLocation}
                                                </p>
                                              ) : null}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>

                                    <p className="mt-3 text-[10px] font-bold leading-4 text-[var(--qoreva-muted)]">
                                      Qoreva surfaces applicable requirement context for review. Qualified users remain responsible for the final planning decision.
                                    </p>
                                  </div>
                                </details>
                              ) : null}

                              <div
                                id={`qoreva-guided-question-${question.questionCode}`}
                                tabIndex={-1}
                                className="
                                  rounded-xl
                                  outline-none
                                  transition-all
                                  duration-300
                                "
                              >
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
                              </div>

                              {unresolvedCompliance.length > 0 ? (
                                <div className="mt-3 grid gap-2">
                                  {unresolvedCompliance.map(
                                    (result) => (
                                      <div
                                        key={`${question.id}-${result.requirementRuleId}`}
                                        className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-3"
                                      >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
                                              Requirement needs attention
                                            </p>

                                            <p className="mt-1 text-sm font-black leading-5 text-[var(--qoreva-obsidian)]">
                                              {result.requirementTitle}
                                            </p>

                                            {result.message ? (
                                              <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                {result.message}
                                              </p>
                                            ) : null}

                                            <p className="mt-2 text-[10px] font-bold leading-4 text-[var(--qoreva-muted)]">
                                              {result.organizationName ||
                                                result.requirementPackName}
                                              {" • "}
                                              {result.packType} Requirement
                                            </p>
                                          </div>

                                          {result.blockingLevel ? (
                                            <span className="shrink-0 rounded-full border border-[#F0BDC4] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-danger)]">
                                              {result.blockingLevel}
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : null}

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
                        No additional activity or requirement questions apply yet.
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
                description="Qoreva assembles the information entered in Steps 1–5 into a structured draft and performs a planning quality check. Missing or weak items are surfaced for human review instead of being silently invented."
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
                  detail="Require focused human review"
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--qoreva-violet)]">
                          Qoreva Work-Step Intelligence
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                          Hazards & Controls
                        </h3>

                        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          Qoreva organized the hazards and controls by work step. Start with anything that needs your review, then open a work step only when you want to see its details.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.workSteps.length} Work Steps`}
                          tone="neutral"
                        />

                        <DocumentStatusBadge
                          label={`${unassignedUserControlReviewItems.length} Need Review`}
                          tone={
                            unassignedUserControlReviewItems.length > 0
                              ? "warning"
                              : "success"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-4 sm:p-5">
                    {generatedPlanningDraft.reviewFlags.some(
                      (flag) => flag.severity === "Critical",
                    ) ? (
                      <div className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[var(--qoreva-danger)]">
                            !
                          </span>

                          <div>
                            <p className="font-black text-[var(--qoreva-obsidian)]">
                              Critical planning items need attention
                            </p>

                            <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                              Resolve the critical items before this plan moves into pre-submission review.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {unassignedUserControlReviewItems.length > 0 ? (
                      <section
                        id="qoreva-control-assignment-review"
                        className="overflow-hidden rounded-2xl border border-[#F0BDC4] bg-white"
                      >
                        <div className="border-b border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9B6212]">
                                Needs Your Review
                              </p>

                              <h4 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                                {unassignedUserControlReviewItems.length > 0
                                  ? `${unassignedUserControlReviewItems.length} control${
                                      unassignedUserControlReviewItems.length === 1
                                        ? ""
                                        : "s"
                                    } need a decision`
                                  : "Review decisions complete"}
                              </h4>

                              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                                Qoreva could not confidently determine the hazard relationship for these controls. Assign, modify, or mark Not Applicable instead of forcing a guess.
                              </p>
                            </div>

                            {resolvedUserControlReviewItems.length > 0 ? (
                              <DocumentStatusBadge
                                label={`${resolvedUserControlReviewItems.length} Resolved`}
                                tone="success"
                              />
                            ) : null}
                          </div>
                        </div>

                        {hazardControlDecisionError ? (
                          <div className="border-b border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)] sm:px-5">
                            {hazardControlDecisionError}
                          </div>
                        ) : null}

                        {hazardControlDecisionsLoading ? (
                          <div className="border-b border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3 text-xs font-bold text-[var(--qoreva-muted)] sm:px-5">
                            Loading saved review decisions...
                          </div>
                        ) : null}

                        {unassignedUserControlReviewItems.length > 0 ? (
                          <div className="grid gap-3 p-4 sm:p-5">
                            {unassignedUserControlReviewItems.map((item) => {
                              const active =
                                activeHazardControlReviewId === item.id;

                              const saving =
                                hazardControlDecisionSavingId === item.id;

                              const suggestedHazards =
                                item.targetHazards.slice(0, 4);

                              const additionalHazards =
                                item.targetHazards.slice(4);

                              return (
                                <article
                                  key={item.id}
                                  className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-porcelain)] p-4"
                                >
                                  <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-violet-dark)]">
                                            Step {item.stepSequence}
                                          </span>

                                          <span className="text-xs font-black text-[var(--qoreva-muted)]">
                                            {item.stepTitle}
                                          </span>
                                        </div>

                                        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                                          {item.control.text}
                                        </p>
                                      </div>

                                      <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[430px]">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openHazardControlReview(
                                              item,
                                              "Assign",
                                            )
                                          }
                                          disabled={saving}
                                          aria-pressed={
                                            active &&
                                            hazardControlReviewMode === "Assign"
                                          }
                                          className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            active &&
                                            hazardControlReviewMode === "Assign"
                                              ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-dark)] text-white"
                                              : "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white hover:bg-[var(--qoreva-violet-dark)]"
                                          }`}
                                        >
                                          Assign
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openHazardControlReview(
                                              item,
                                              "Modify",
                                            )
                                          }
                                          disabled={saving}
                                          aria-pressed={
                                            active &&
                                            hazardControlReviewMode === "Modify"
                                          }
                                          className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            active &&
                                            hazardControlReviewMode === "Modify"
                                              ? "border-[#53B9B0] bg-[#EAF8F6] text-[#176E68]"
                                              : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:bg-[var(--qoreva-surface-muted)]"
                                          }`}
                                        >
                                          Modify
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openHazardControlReview(
                                              item,
                                              "NotApplicable",
                                            )
                                          }
                                          disabled={saving}
                                          aria-pressed={
                                            active &&
                                            hazardControlReviewMode ===
                                              "NotApplicable"
                                          }
                                          className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            active &&
                                            hazardControlReviewMode ===
                                              "NotApplicable"
                                              ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                                              : "border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-muted)] hover:bg-[var(--qoreva-surface-muted)]"
                                          }`}
                                        >
                                          Not Applicable
                                        </button>
                                      </div>
                                    </div>

                                    {active ? (
                                      <div className="rounded-2xl border border-[rgba(102,87,232,0.20)] bg-white p-4">
                                        {hazardControlReviewMode === "Assign" ? (
                                          <div>
                                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                              Which hazard does this control mitigate?
                                            </p>

                                            <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                              Start with Qoreva's most relevant hazards. Choose View all only if the correct hazard is not shown.
                                            </p>

                                            {item.targetHazards.length > 0 ? (
                                              <div className="mt-3 grid gap-2">
                                                {suggestedHazards.map((hazard) => {
                                                  const selected =
                                                    selectedTargetHazardId ===
                                                    hazard.id;

                                                  const presentation =
                                                    getHazardPresentation(
                                                      hazard.text,
                                                      hazard.sourceActivityCodes,
                                                    );

                                                  return (
                                                    <button
                                                      key={hazard.id}
                                                      type="button"
                                                      onClick={() =>
                                                        setSelectedTargetHazardId(
                                                          hazard.id,
                                                        )
                                                      }
                                                      aria-pressed={selected}
                                                      className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-left transition ${
                                                        selected
                                                          ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)] ring-4 ring-[rgba(102,87,232,0.06)]"
                                                          : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] hover:border-[rgba(102,87,232,0.28)]"
                                                      }`}
                                                    >
                                                      <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                          selected
                                                            ? "bg-[var(--qoreva-violet)] text-white"
                                                            : "bg-white text-[var(--qoreva-violet-dark)]"
                                                        }`}
                                                      >
                                                        <HazardIcon
                                                          category={
                                                            presentation.category
                                                          }
                                                          className="h-4 w-4"
                                                        />
                                                      </span>

                                                      <span className="min-w-0">
                                                        <span className="block text-sm font-black text-[var(--qoreva-obsidian)]">
                                                          {hazard.text}
                                                        </span>
                                                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--qoreva-muted)]">
                                                          {presentation.category}
                                                        </span>
                                                      </span>
                                                    </button>
                                                  );
                                                })}

                                                {additionalHazards.length > 0 ? (
                                                  <details className="rounded-xl border border-[var(--qoreva-border)] bg-white">
                                                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-black text-[var(--qoreva-violet-dark)] [&::-webkit-details-marker]:hidden">
                                                      <span>View all hazards</span>
                                                      <span className="text-[10px] font-bold text-[var(--qoreva-muted)]">
                                                        +{additionalHazards.length}
                                                      </span>
                                                    </summary>

                                                    <div className="grid gap-2 border-t border-[var(--qoreva-border)] p-3">
                                                      {additionalHazards.map(
                                                        (hazard) => {
                                                          const selected =
                                                            selectedTargetHazardId ===
                                                            hazard.id;

                                                          const presentation =
                                                            getHazardPresentation(
                                                              hazard.text,
                                                              hazard.sourceActivityCodes,
                                                            );

                                                          return (
                                                            <button
                                                              key={hazard.id}
                                                              type="button"
                                                              onClick={() =>
                                                                setSelectedTargetHazardId(
                                                                  hazard.id,
                                                                )
                                                              }
                                                              aria-pressed={selected}
                                                              className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-left transition ${
                                                                selected
                                                                  ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet-faint)]"
                                                                  : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                                                              }`}
                                                            >
                                                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--qoreva-violet-dark)]">
                                                                <HazardIcon
                                                                  category={
                                                                    presentation.category
                                                                  }
                                                                  className="h-4 w-4"
                                                                />
                                                              </span>

                                                              <span className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                                                {hazard.text}
                                                              </span>
                                                            </button>
                                                          );
                                                        },
                                                      )}
                                                    </div>
                                                  </details>
                                                ) : null}
                                              </div>
                                            ) : (
                                              <div className="mt-3 rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-3 text-xs font-bold leading-5 text-[#9B6212]">
                                                No existing hazard is available for assignment in this work step. Return to Guided Planning and identify the specific hazard first.
                                              </div>
                                            )}

                                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                              <button
                                                type="button"
                                                onClick={cancelHazardControlReview}
                                                disabled={saving}
                                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:opacity-60"
                                              >
                                                Cancel
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void saveHazardControlDecision(
                                                    item,
                                                    "Assign",
                                                  )
                                                }
                                                disabled={
                                                  saving ||
                                                  !selectedTargetHazardId
                                                }
                                                className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                              >
                                                {saving
                                                  ? "Saving..."
                                                  : "Confirm Assignment"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : null}

                                        {hazardControlReviewMode === "Modify" ? (
                                          <div>
                                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                              Modify this control
                                            </p>

                                            <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                              Rewrite the control so it is clear, specific, and tied to the actual work.
                                            </p>

                                            <textarea
                                              value={modifiedControlText}
                                              rows={4}
                                              onChange={(event) =>
                                                setModifiedControlText(
                                                  event.target.value,
                                                )
                                              }
                                              className={`mt-3 ${textareaClassName}`}
                                            />

                                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                              <button
                                                type="button"
                                                onClick={cancelHazardControlReview}
                                                disabled={saving}
                                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:opacity-60"
                                              >
                                                Cancel
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void saveHazardControlDecision(
                                                    item,
                                                    "Modify",
                                                  )
                                                }
                                                disabled={
                                                  saving ||
                                                  !modifiedControlText.trim()
                                                }
                                                className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                              >
                                                {saving
                                                  ? "Saving..."
                                                  : "Save Modified Control"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : null}

                                        {hazardControlReviewMode ===
                                        "NotApplicable" ? (
                                          <div>
                                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                              Mark this control Not Applicable?
                                            </p>

                                            <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                              Use this only when the control does not apply to the actual work or exposure. The decision remains in the audit history.
                                            </p>

                                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                              <button
                                                type="button"
                                                onClick={cancelHazardControlReview}
                                                disabled={saving}
                                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:opacity-60"
                                              >
                                                Cancel
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void saveHazardControlDecision(
                                                    item,
                                                    "NotApplicable",
                                                  )
                                                }
                                                disabled={saving}
                                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-2 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[#FBE8EB] disabled:cursor-not-allowed disabled:opacity-60"
                                              >
                                                {saving
                                                  ? "Saving..."
                                                  : "Confirm Not Applicable"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 sm:p-5">
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                              <p className="font-black text-[var(--qoreva-obsidian)]">
                                Review decisions complete
                              </p>

                              <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                                Qoreva preserved each qualified-user decision. The final plan still requires pre-submission review and the configured approval/signature workflow.
                              </p>
                            </div>
                          </div>
                        )}
                      </section>
                    ) : null}

                    {allUnassignedUserControlReviewItems.length > 0 &&
                    unassignedUserControlReviewItems.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-700">
                            ✓
                          </span>

                          <div>
                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                              Review complete
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-[var(--qoreva-muted)]">
                              All hazard/control assignment decisions are resolved.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {lastRemovedHazard ? (
                      <div className="rounded-2xl border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-faint)] px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                              Hazard removed
                            </p>

                            <p className="mt-0.5 truncate text-xs font-medium text-[var(--qoreva-muted)]">
                              {lastRemovedHazard.hazardText}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void undoLastHazardRemoval()
                            }
                            disabled={
                              hazardControlOverrideSavingId !==
                              null
                            }
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(102,87,232,0.24)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <section>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                            Work Steps
                          </p>

                          <h4 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                            Review and qualify hazards by work step
                          </h4>

                          <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                            Open only the hazard you need. Edit wording when the hazard meaning is unchanged, or use Change Hazard when the actual hazard classification or exposure is different.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => returnToStep(5)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
                        >
                          Modify Planning Inputs
                        </button>
                      </div>

                      {hazardControlOverrideError ? (
                        <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)]">
                          {hazardControlOverrideError}
                        </div>
                      ) : null}

                      {hazardControlOverridesLoading ? (
                        <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-white px-4 py-3 text-xs font-bold text-[var(--qoreva-muted)]">
                          Loading saved hazard changes...
                        </div>
                      ) : null}

                      {hazardControlDecisionError ? (
                        <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-danger)]">
                          {hazardControlDecisionError}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3">
                        {generatedPlanningDraft.workSteps.map((step) => {
                          const visibleGroups = (
                            step.hazardControlGroups ?? []
                          ).filter(
                            (group) =>
                              group.hazard.text !==
                              "User-entered controls requiring hazard assignment",
                          );

                          const visibleHazardIds =
                            visibleGroups.map(
                              (group) =>
                                group.hazard.id,
                            );

                          const allHazardsExpanded =
                            visibleHazardIds.length > 0 &&
                            visibleHazardIds.every(
                              (hazardId) =>
                                expandedHazardIds.has(
                                  hazardId,
                                ),
                            );

                          const controlCount = visibleGroups.reduce(
                            (total, group) =>
                              total + group.controls.length,
                            0,
                          );

                          const hasMissingControl = visibleGroups.some(
                            (group) => group.controls.length === 0,
                          );

                          const addEditorOpen =
                            activeHazardEditor?.mode ===
                              "Add" &&
                            activeHazardEditor.stepSequence ===
                              step.sequence &&
                            activeHazardEditor.stepTitle ===
                              step.title;

                          const normalizedStepTitle =
                            step.title
                              .trim()
                              .toLowerCase();

                          const removedHazardsForStep =
                            removedHazardOverrides.filter(
                              (override) =>
                                override.workStepSequence ===
                                  step.sequence ||
                                override.workStepTitle
                                  ?.trim()
                                  .toLowerCase() ===
                                  normalizedStepTitle,
                            );

                          return (
                            <details
                              key={`${step.sequence}-${step.title}`}
                              className="group overflow-hidden rounded-2xl border border-[var(--qoreva-border)] bg-white"
                            >
                              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-obsidian)] text-xs font-black text-[#B9B0FF]">
                                  {step.sequence}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="font-black text-[var(--qoreva-obsidian)]">
                                        {step.title}
                                      </p>

                                      <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                                        {visibleGroups.length} hazard
                                        {visibleGroups.length === 1 ? "" : "s"}
                                        {" • "}
                                        {controlCount} control
                                        {controlCount === 1 ? "" : "s"}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {hasMissingControl ? (
                                        <DocumentStatusBadge
                                          label="Control Required"
                                          tone="danger"
                                        />
                                      ) : (
                                        <DocumentStatusBadge
                                          label="Ready"
                                          tone="success"
                                        />
                                      )}

                                      {step.safetyCriticalSuggested ? (
                                        <DocumentStatusBadge
                                          label="Safety Critical"
                                          tone="danger"
                                        />
                                      ) : null}

                                      <span className="text-sm font-black text-[var(--qoreva-muted)] transition-transform group-open:rotate-180">
                                        ▾
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </summary>

                              <div className="border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:p-5">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setWorkStepHazardsExpanded(
                                          visibleHazardIds,
                                          !allHazardsExpanded,
                                        )
                                      }
                                      disabled={
                                        visibleHazardIds.length ===
                                        0
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-porcelain)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {allHazardsExpanded
                                        ? "Collapse All Hazards"
                                        : "Expand All Hazards"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openAddHazardEditor(
                                          step,
                                        )
                                      }
                                      disabled={
                                        hazardControlOverrideSavingId !==
                                        null
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(102,87,232,0.24)] bg-[var(--qoreva-violet-soft)] px-3 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      + Add Hazard
                                    </button>
                                  </div>

                                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--qoreva-muted)]">
                                    Qualified user controls final content
                                  </p>
                                </div>

                                {addEditorOpen ? (
                                  <div className="mb-4 rounded-2xl border border-[rgba(102,87,232,0.24)] bg-[var(--qoreva-violet-faint)] p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                                      Add Hazard
                                    </p>

                                    <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                      Add a hazard that applies to {step.title}
                                    </p>

                                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                      Enter the hazard in field language. Qoreva may organize it against known hazard/control relationships, but your wording remains the qualified-user input.
                                    </p>

                                    <textarea
                                      value={hazardEditorText}
                                      rows={3}
                                      placeholder="Example: Workers exposed to pinch points while positioning material"
                                      onChange={(event) => {
                                        setHazardEditorText(
                                          event.target.value,
                                        );
                                        setHazardControlOverrideError(
                                          "",
                                        );
                                      }}
                                      className={`mt-3 ${textareaClassName}`}
                                    />

                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                      <button
                                        type="button"
                                        onClick={
                                          cancelHazardEditor
                                        }
                                        disabled={
                                          hazardControlOverrideSavingId !==
                                          null
                                        }
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        onClick={
                                          saveHazardOverride
                                        }
                                        disabled={
                                          hazardControlOverrideSavingId !==
                                          null
                                        }
                                        className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                      >
                                        {hazardControlOverrideSavingId
                                          ? "Saving..."
                                          : "Add Hazard"}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}

                                {visibleGroups.length > 0 ? (
                                  <div className="grid gap-3">
                                    {visibleGroups.map((group) => {
                                      const hazardPresentation =
                                        getHazardPresentation(
                                          group.hazard.text,
                                          group.hazard.sourceActivityCodes ?? [],
                                        );

                                      const hazardExpanded =
                                        expandedHazardIds.has(
                                          group.hazard.id,
                                        );

                                      const editorOpen =
                                        activeHazardEditor?.hazardId ===
                                          group.hazard.id &&
                                        activeHazardEditor.stepSequence ===
                                          step.sequence &&
                                        activeHazardEditor.mode !==
                                          "Add";

                                      const savingThisHazard =
                                        hazardControlOverrideSavingId ===
                                          group.hazard.id;

                                      const unresolvedControlRelationship =
                                        group.hazard.source === "User" &&
                                        group.controls.length === 0;

                                      return (
                                        <article
                                          key={group.id}
                                          data-guided-hazard-id={group.hazard.id}
                                          tabIndex={-1}
                                          className={`overflow-hidden rounded-2xl border bg-white outline-none transition ${
                                            unresolvedControlRelationship
                                              ? "border-[#D92D45] ring-2 ring-[rgba(217,45,69,0.10)] focus:ring-4 focus:ring-[rgba(217,45,69,0.18)]"
                                              : "border-[var(--qoreva-border)]"
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleHazardExpanded(
                                                group.hazard.id,
                                              )
                                            }
                                            aria-expanded={
                                              hazardExpanded
                                            }
                                            className={`flex w-full items-start gap-3 p-4 text-left transition ${
                                              unresolvedControlRelationship
                                                ? "bg-[var(--qoreva-danger-soft)] hover:bg-[#FBE8EB]"
                                                : "hover:bg-[var(--qoreva-porcelain)]"
                                            }`}
                                          >
                                            <span
                                              aria-hidden="true"
                                              title={hazardPresentation.category}
                                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet-faint)] text-[var(--qoreva-violet-dark)]"
                                            >
                                              <HazardIcon
                                                category={
                                                  hazardPresentation.category
                                                }
                                                className="h-5 w-5"
                                              />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-violet)]">
                                                    {hazardPresentation.category}
                                                  </p>

                                                  <h5 className="mt-1 text-sm font-black leading-5 text-[var(--qoreva-obsidian)]">
                                                    {group.hazard.text}
                                                  </h5>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                  <span className="text-[10px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-muted)]">
                                                    {group.controls.length} control
                                                    {group.controls.length === 1
                                                      ? ""
                                                      : "s"}
                                                  </span>

                                                  {unresolvedControlRelationship ? (
                                                    <DocumentStatusBadge
                                                      label="Control Required"
                                                      tone="danger"
                                                    />
                                                  ) : null}

                                                  <span
                                                    aria-hidden="true"
                                                    className={`text-sm font-black text-[var(--qoreva-muted)] transition-transform ${
                                                      hazardExpanded
                                                        ? "rotate-180"
                                                        : ""
                                                    }`}
                                                  >
                                                    ▾
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </button>

                                          {unresolvedControlRelationship ? (
                                            <div className="border-t border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3">
                                              <p className="text-xs font-black text-[var(--qoreva-danger)]">
                                                Control required before submission
                                              </p>
                                              <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                This user-entered hazard does not currently have an assigned control. Open the hazard and add at least one appropriate control.
                                              </p>
                                            </div>
                                          ) : null}

                                          {hazardExpanded ? (
                                            <div className="border-t border-[var(--qoreva-border)] bg-white p-4">
                                              <div className="flex flex-wrap gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openExistingHazardEditor(
                                                      step,
                                                      group,
                                                      "Edit",
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                    null
                                                  }
                                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1.5 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  Edit Wording
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openExistingHazardEditor(
                                                      step,
                                                      group,
                                                      "Change",
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                    null
                                                  }
                                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[rgba(102,87,232,0.24)] bg-[var(--qoreva-violet-soft)] px-3 py-1.5 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  Change Hazard
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    void removeHazard(
                                                      step,
                                                      group,
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                    null
                                                  }
                                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#F0BDC4] bg-white px-3 py-1.5 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  Remove Hazard
                                                </button>
                                                {group.hazard.source ===
                                                  "User" &&
                                                group.controls.length ===
                                                  0 &&
                                                isMaterialHandlingResolutionCandidate(
                                                  group.hazard.text,
                                                ) ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      openHazardResolution(
                                                        step,
                                                        group,
                                                      )
                                                    }
                                                    disabled={
                                                      hazardControlOverrideSavingId !==
                                                      null
                                                    }
                                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-3 py-1.5 text-xs font-black text-[#9B6212] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                  >
                                                    Resolve Hazard
                                                  </button>
                                                ) : null}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openAddControlEditor(
                                                      step,
                                                      group,
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                    null
                                                  }
                                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#B9DCCB] bg-[var(--qoreva-success-soft)] px-3 py-1.5 text-xs font-black text-[var(--qoreva-success)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  + Add Control
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    void generateRecommendedControls(
                                                      step,
                                                      group,
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                      null ||
                                                    recommendedControlsSaving ||
                                                    recommendedControlsLoadingKey !==
                                                      null
                                                  }
                                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[rgba(102,87,232,0.24)] bg-[var(--qoreva-violet-faint)] px-3 py-1.5 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  {recommendedControlsLoadingKey ===
                                                  `${step.sequence}:${group.hazard.id}`
                                                    ? "Generating..."
                                                    : "✨ Generate Recommended Controls"}
                                                </button>
                                              </div>

                                              {activeRecommendedControls?.key ===
                                              `${step.sequence}:${group.hazard.id}` ? (
                                                <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(102,87,232,0.22)] bg-white">
                                                  <div className="border-b border-[rgba(102,87,232,0.16)] bg-[var(--qoreva-violet-faint)] p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                                                      Qoreva Recommended Controls
                                                    </p>

                                                    <h6 className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                                      Select the controls that apply
                                                    </h6>

                                                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                      Select one, several, or all recommendations. Nothing is added until you confirm the selection.
                                                    </p>
                                                  </div>

                                                  {recommendedControlsError ? (
                                                    <div className="border-b border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-xs font-black text-[var(--qoreva-danger)]">
                                                      {recommendedControlsError}
                                                    </div>
                                                  ) : null}

                                                  {(activeRecommendedControls.response.recommendations?.length ??
                                                    0) > 0 ? (
                                                    <>
                                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3">
                                                        <p className="text-xs font-bold text-[var(--qoreva-muted)]">
                                                          {selectedRecommendedControlIds.length} selected
                                                        </p>

                                                        <div className="flex gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setSelectedRecommendedControlIds(
                                                                (
                                                                  activeRecommendedControls.response.recommendations ??
                                                                  []
                                                                ).map(
                                                                  (recommendation) =>
                                                                    recommendation.id,
                                                                ),
                                                              )
                                                            }
                                                            disabled={
                                                              recommendedControlsSaving
                                                            }
                                                            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1 text-[10px] font-black text-[var(--qoreva-text)]"
                                                          >
                                                            Select All
                                                          </button>

                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setSelectedRecommendedControlIds([])
                                                            }
                                                            disabled={
                                                              recommendedControlsSaving ||
                                                              selectedRecommendedControlIds.length ===
                                                                0
                                                            }
                                                            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1 text-[10px] font-black text-[var(--qoreva-text)] disabled:opacity-60"
                                                          >
                                                            Clear
                                                          </button>
                                                        </div>
                                                      </div>

                                                      <div className="grid gap-2 p-4">
                                                        {(activeRecommendedControls.response.recommendations ??
                                                          []).map(
                                                          (recommendation) => {
                                                            const selected =
                                                              selectedRecommendedControlIds.includes(
                                                                recommendation.id,
                                                              );

                                                            return (
                                                              <label
                                                                key={
                                                                  recommendation.id
                                                                }
                                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                                                  selected
                                                                    ? "border-[rgba(102,87,232,0.36)] bg-[var(--qoreva-violet-faint)]"
                                                                    : "border-[var(--qoreva-border)] bg-[var(--qoreva-porcelain)]"
                                                                }`}
                                                              >
                                                                <input
                                                                  type="checkbox"
                                                                  checked={
                                                                    selected
                                                                  }
                                                                  onChange={() =>
                                                                    toggleRecommendedControl(
                                                                      recommendation.id,
                                                                    )
                                                                  }
                                                                  disabled={
                                                                    recommendedControlsSaving
                                                                  }
                                                                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--qoreva-violet)]"
                                                                />

                                                                <div className="min-w-0 flex-1">
                                                                  <p className="text-sm font-black leading-5 text-[var(--qoreva-obsidian)]">
                                                                    {
                                                                      recommendation.text
                                                                    }
                                                                  </p>

                                                                  <div className="mt-2 flex flex-wrap gap-2">
                                                                    <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-violet-dark)]">
                                                                      Qoreva Recommended
                                                                    </span>

                                                                    <span className="rounded-full border border-[var(--qoreva-border)] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-muted)]">
                                                                      {
                                                                        recommendation.canonicalHazardLabel
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                </div>
                                                              </label>
                                                            );
                                                          },
                                                        )}
                                                      </div>

                                                      <div className="flex flex-col-reverse gap-2 border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="text-xs font-medium text-[var(--qoreva-muted)]">
                                                          AI assists. Qualified people decide what becomes part of the PTP.
                                                        </p>

                                                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                                          <button
                                                            type="button"
                                                            onClick={
                                                              closeRecommendedControls
                                                            }
                                                            disabled={
                                                              recommendedControlsSaving
                                                            }
                                                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] disabled:opacity-60"
                                                          >
                                                            Cancel
                                                          </button>

                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              void addSelectedRecommendedControls()
                                                            }
                                                            disabled={
                                                              recommendedControlsSaving ||
                                                              selectedRecommendedControlIds.length ===
                                                                0
                                                            }
                                                            className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                                          >
                                                            {recommendedControlsSaving
                                                              ? "Adding Controls..."
                                                              : `Add Selected Controls (${selectedRecommendedControlIds.length})`}
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <div className="p-4">
                                                      <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                                        No additional recommended controls found
                                                      </p>

                                                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                        {activeRecommendedControls.response.guidance ||
                                                          "Add a qualified-user control manually or review the hazard classification."}
                                                      </p>

                                                      <button
                                                        type="button"
                                                        onClick={
                                                          closeRecommendedControls
                                                        }
                                                        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1.5 text-xs font-black text-[var(--qoreva-text)]"
                                                      >
                                                        Close
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : null}

                                              {editorOpen ? (
                                                <div className="mt-3 rounded-xl border border-[rgba(102,87,232,0.22)] bg-[var(--qoreva-violet-faint)] p-3">
                                                  <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                                    {activeHazardEditor?.mode ===
                                                    "Change"
                                                      ? "Change the hazard meaning / classification"
                                                      : "Edit the hazard wording"}
                                                  </p>

                                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                    {activeHazardEditor?.mode ===
                                                    "Change"
                                                      ? "Use this when the actual exposure is different. Qoreva will not silently keep controls that belonged to the old hazard meaning."
                                                      : "Use this when the hazard is still the same exposure and only the field wording needs improvement."}
                                                  </p>

                                                  <textarea
                                                    value={
                                                      hazardEditorText
                                                    }
                                                    rows={3}
                                                    onChange={(event) => {
                                                      setHazardEditorText(
                                                        event.target.value,
                                                      );
                                                      setHazardControlOverrideError(
                                                        "",
                                                      );
                                                    }}
                                                    className={`mt-3 ${textareaClassName}`}
                                                  />

                                                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                    <button
                                                      type="button"
                                                      onClick={
                                                        cancelHazardEditor
                                                      }
                                                      disabled={
                                                        savingThisHazard
                                                      }
                                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                      Cancel
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={
                                                        saveHazardOverride
                                                      }
                                                      disabled={
                                                        hazardControlOverrideSavingId !==
                                                        null
                                                      }
                                                      className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                                    >
                                                      {savingThisHazard
                                                        ? "Saving..."
                                                        : activeHazardEditor?.mode ===
                                                            "Change"
                                                          ? "Save Changed Hazard"
                                                          : "Save Wording"}
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : null}

                                              {activeHazardResolution?.hazardId ===
                                                group.hazard.id &&
                                              activeHazardResolution.stepSequence ===
                                                step.sequence ? (
                                                <div className="mt-4 rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-4">
                                                  <div className="flex items-start gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[#9B6212]">
                                                      ?
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#9B6212]">
                                                        Resolve Broad Hazard
                                                      </p>

                                                      <h6 className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                                        What does “{group.hazard.text}” actually expose the crew to?
                                                      </h6>

                                                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                        Select every exposure that applies. Qoreva will split them into separate hazards so each hazard can carry the controls that actually mitigate it.
                                                      </p>
                                                    </div>
                                                  </div>

                                                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                    {materialHandlingResolutionOptions.map(
                                                      (option) => {
                                                        const selected =
                                                          selectedHazardResolutionIds.includes(
                                                            option.id,
                                                          );

                                                        return (
                                                          <button
                                                            key={
                                                              option.id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                              toggleHazardResolutionOption(
                                                                option.id,
                                                              )
                                                            }
                                                            aria-pressed={
                                                              selected
                                                            }
                                                            className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-left transition ${
                                                              selected
                                                                ? "border-[var(--qoreva-violet)] bg-white ring-4 ring-[rgba(102,87,232,0.06)]"
                                                                : "border-[#E8C276] bg-white hover:border-[var(--qoreva-violet)]"
                                                            }`}
                                                          >
                                                            <span
                                                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                                                selected
                                                                  ? "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white"
                                                                  : "border-[var(--qoreva-border-strong)] bg-white text-transparent"
                                                              }`}
                                                            >
                                                              <CheckIcon />
                                                            </span>

                                                            <span className="text-xs font-black leading-5 text-[var(--qoreva-obsidian)]">
                                                              {
                                                                option.label
                                                              }
                                                            </span>
                                                          </button>
                                                        );
                                                      },
                                                    )}
                                                  </div>

                                                  <div className="mt-3 rounded-xl border border-[#E8C276] bg-white p-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-muted)]">
                                                      Other / Custom Hazard
                                                    </label>

                                                    <textarea
                                                      value={
                                                        customHazardResolutionText
                                                      }
                                                      rows={2}
                                                      placeholder="Describe another material-handling exposure if needed..."
                                                      onChange={(event) => {
                                                        setCustomHazardResolutionText(
                                                          event.target.value,
                                                        );
                                                        setHazardControlOverrideError(
                                                          "",
                                                        );
                                                      }}
                                                      className={`mt-2 ${textareaClassName}`}
                                                    />
                                                  </div>

                                                  <div className="mt-3 rounded-xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-3">
                                                    <p className="text-xs font-bold leading-5 text-[var(--qoreva-muted)]">
                                                      Qoreva will use the first selected exposure to replace the broad hazard and add any additional selected exposures as separate hazards. Controls remain subject to qualified-user review.
                                                    </p>
                                                  </div>

                                                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                    <button
                                                      type="button"
                                                      onClick={
                                                        cancelHazardResolution
                                                      }
                                                      disabled={
                                                        hazardControlOverrideSavingId !==
                                                        null
                                                      }
                                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                      Cancel
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={
                                                        saveHazardResolution
                                                      }
                                                      disabled={
                                                        hazardControlOverrideSavingId !==
                                                        null
                                                      }
                                                      className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                                    >
                                                      {hazardControlOverrideSavingId
                                                        ? "Resolving..."
                                                        : "Resolve & Reevaluate Controls"}
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : null}

                                              {activeControlEditor?.mode ===
                                                "Add" &&
                                              activeControlEditor.parentHazardId ===
                                                group.hazard.id &&
                                              activeControlEditor.stepSequence ===
                                                step.sequence ? (
                                                <div className="mt-4 rounded-xl border border-[#B9DCCB] bg-[var(--qoreva-success-soft)] p-3">
                                                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-success)]">
                                                    Add Control
                                                  </p>

                                                  <p className="mt-1 text-sm font-black text-[var(--qoreva-obsidian)]">
                                                    Add a control for {group.hazard.text}
                                                  </p>

                                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                    Enter the exact control the crew will use. Qoreva does not require AI wording and will preserve this as qualified-user content.
                                                  </p>

                                                  <textarea
                                                    value={
                                                      controlEditorText
                                                    }
                                                    rows={3}
                                                    placeholder="Example: Maintain hands clear of pinch points and use a tag line or positioning tool when needed."
                                                    onChange={(event) => {
                                                      setControlEditorText(
                                                        event.target.value,
                                                      );
                                                      setHazardControlOverrideError(
                                                        "",
                                                      );
                                                    }}
                                                    className={`mt-3 ${textareaClassName}`}
                                                  />

                                                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                    <button
                                                      type="button"
                                                      onClick={
                                                        cancelControlEditor
                                                      }
                                                      disabled={
                                                        hazardControlOverrideSavingId !==
                                                        null
                                                      }
                                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                      Cancel
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={
                                                        saveControlOverride
                                                      }
                                                      disabled={
                                                        hazardControlOverrideSavingId !==
                                                        null
                                                      }
                                                      className={`${primaryButtonClassName} min-h-10 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                                                    >
                                                      {hazardControlOverrideSavingId
                                                        ? "Saving..."
                                                        : "Add Control"}
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : null}

                                              {group.controls.length > 0 ? (
                                                <div className="mt-4 grid gap-2">
                                                  {group.controls.map(
                                                    (control) => (
                                                      <div
                                                        key={control.id}
                                                        className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-porcelain)] p-3"
                                                      >
                                                        <div className="flex items-start gap-2.5">
                                                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-success-soft)] text-[10px] font-black text-[var(--qoreva-success)]">
                                                            ✓
                                                          </span>

                                                          <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium leading-5 text-[var(--qoreva-obsidian)]">
                                                              {control.text}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  openEditControlEditor(
                                                                    step,
                                                                    group,
                                                                    control,
                                                                  )
                                                                }
                                                                disabled={
                                                                  hazardControlOverrideSavingId !==
                                                                    null ||
                                                                  hazardControlDecisionSavingId !==
                                                                    null
                                                                }
                                                                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                              >
                                                                Edit Control
                                                              </button>

                                                              {control.source ===
                                                                "User" &&
                                                              !control.required ? (
                                                                <button
                                                                  type="button"
                                                                  onClick={() =>
                                                                    removeUserControl(
                                                                      step,
                                                                      group,
                                                                      control,
                                                                    )
                                                                  }
                                                                  disabled={
                                                                    hazardControlOverrideSavingId !==
                                                                      null ||
                                                                    hazardControlDecisionSavingId !==
                                                                      null
                                                                  }
                                                                  className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[#F0BDC4] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                  {hazardControlOverrideSavingId ===
                                                                  control.id
                                                                    ? "Removing..."
                                                                    : "Remove"}
                                                                </button>
                                                              ) : (
                                                                <button
                                                                  type="button"
                                                                  onClick={() =>
                                                                    markVisibleControlNotApplicable(
                                                                      step,
                                                                      group,
                                                                      control,
                                                                    )
                                                                  }
                                                                  disabled={
                                                                    hazardControlOverrideSavingId !==
                                                                      null ||
                                                                    hazardControlDecisionSavingId !==
                                                                      null
                                                                  }
                                                                  className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[#F0BDC4] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                  {hazardControlDecisionSavingId ===
                                                                  control.id
                                                                    ? "Saving..."
                                                                    : "Not Applicable"}
                                                                </button>
                                                              )}

                                                              <span className="text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-muted)]">
                                                                {control.source ===
                                                                "Rule"
                                                                  ? "Qoreva Rule"
                                                                  : control.source}
                                                              </span>

                                                              {control.required ? (
                                                                <span className="rounded-full border border-[#F0BDC4] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-danger)]">
                                                                  Requirement-backed
                                                                </span>
                                                              ) : null}
                                                            </div>

                                                            {activeControlEditor?.mode ===
                                                              "Edit" &&
                                                            activeControlEditor.controlId ===
                                                              control.id &&
                                                            activeControlEditor.stepSequence ===
                                                              step.sequence ? (
                                                              <div className="mt-3 rounded-xl border border-[rgba(102,87,232,0.22)] bg-white p-3">
                                                                <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                                                  Edit control wording
                                                                </p>

                                                                <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                                  The original source remains preserved in the audit history. This becomes the qualified-user wording shown in the working draft.
                                                                </p>

                                                                <textarea
                                                                  value={
                                                                    controlEditorText
                                                                  }
                                                                  rows={3}
                                                                  onChange={(event) => {
                                                                    setControlEditorText(
                                                                      event.target.value,
                                                                    );
                                                                    setHazardControlOverrideError(
                                                                      "",
                                                                    );
                                                                  }}
                                                                  className={`mt-3 ${textareaClassName}`}
                                                                />

                                                                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                                  <button
                                                                    type="button"
                                                                    onClick={
                                                                      cancelControlEditor
                                                                    }
                                                                    disabled={
                                                                      hazardControlOverrideSavingId !==
                                                                      null
                                                                    }
                                                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-1.5 text-[10px] font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                                                                  >
                                                                    Cancel
                                                                  </button>

                                                                  <button
                                                                    type="button"
                                                                    onClick={
                                                                      saveControlOverride
                                                                    }
                                                                    disabled={
                                                                      hazardControlOverrideSavingId !==
                                                                      null
                                                                    }
                                                                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--qoreva-violet)] px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-[var(--qoreva-violet-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                                  >
                                                                    {hazardControlOverrideSavingId ===
                                                                    control.id
                                                                      ? "Saving..."
                                                                      : "Save Control"}
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            ) : null}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="mt-4 rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-3">
                                                  <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                                    No specific control is mapped to this hazard yet.
                                                  </p>

                                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                    Qoreva preserved the hazard rather than inventing an unsupported control relationship. You can change the hazard above if the field wording is too broad or does not describe the actual exposure.
                                                  </p>
                                                </div>
                                              )}

                                              <details className="mt-3">
                                                <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-muted)]">
                                                  Sources & requirement details
                                                </summary>

                                                <div className="mt-2 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                  <p>
                                                    Hazard source: {group.hazard.source === "Rule"
                                                      ? "Qoreva Rule"
                                                      : group.hazard.source}
                                                  </p>

                                                  {group.hazard.sourceActivityCodes.length >
                                                  0 ? (
                                                    <p className="mt-1">
                                                      Activities: {group.hazard.sourceActivityCodes
                                                        .map((code) =>
                                                          code.replaceAll("_", " "),
                                                        )
                                                        .join(", ")}
                                                    </p>
                                                  ) : null}

                                                  {group.hazard.sourceRequirementIds.length >
                                                  0 ? (
                                                    <p className="mt-1">
                                                      Requirement references: {group.hazard.sourceRequirementIds.length}
                                                    </p>
                                                  ) : null}

                                                  {group.hazard.required ? (
                                                    <p className="mt-1 font-black text-[var(--qoreva-danger)]">
                                                      Requirement-backed item — material changes require qualified-person review.
                                                    </p>
                                                  ) : null}
                                                </div>
                                              </details>
                                            </div>
                                          ) : null}
                                        </article>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-white p-4">
                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                      No structured hazard-to-control map is available for this work step.
                                    </p>

                                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                      Add a hazard here or return to Guided Planning to review the preserved work-step inputs.
                                    </p>
                                  </div>
                                )}

                                {removedHazardsForStep.length > 0 ? (
                                  <details className="mt-4 overflow-hidden rounded-xl border border-[rgba(102,87,232,0.18)] bg-white">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                                      <div>
                                        <p className="text-xs font-black text-[var(--qoreva-obsidian)]">
                                          Removed Hazards ({removedHazardsForStep.length})
                                        </p>

                                        <p className="mt-0.5 text-[10px] font-medium text-[var(--qoreva-muted)]">
                                          Hidden from the active plan, retained for audit and later restoration.
                                        </p>
                                      </div>

                                      <span className="text-xs font-black text-[var(--qoreva-muted)]">
                                        ▾
                                      </span>
                                    </summary>

                                    <div className="grid gap-2 border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
                                      {removedHazardsForStep.map(
                                        (override) => {
                                          const restoreId =
                                            override.targetItemId ??
                                            override.id;

                                          const restoring =
                                            hazardControlOverrideSavingId ===
                                            restoreId;

                                          return (
                                            <div
                                              key={override.id}
                                              className="rounded-xl border border-[var(--qoreva-border)] bg-white p-3"
                                            >
                                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                                      {override.originalText}
                                                    </p>

                                                    <span className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-muted)]">
                                                      {override.sourceType ===
                                                      "Rule"
                                                        ? "Qoreva Rule"
                                                        : override.sourceType ||
                                                          "Unknown Source"}
                                                    </span>
                                                  </div>

                                                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                                    {override.reason ||
                                                      "Removed from the active plan by a qualified user."}
                                                  </p>
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    void restoreRemovedHazard(
                                                      override,
                                                    )
                                                  }
                                                  disabled={
                                                    hazardControlOverrideSavingId !==
                                                    null
                                                  }
                                                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(102,87,232,0.24)] bg-[var(--qoreva-violet-soft)] px-4 py-2 text-xs font-black text-[var(--qoreva-violet-dark)] transition hover:bg-[var(--qoreva-violet-faint)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  {restoring
                                                    ? "Restoring..."
                                                    : "Restore Hazard"}
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </section>

                    <details className="rounded-2xl border border-[var(--qoreva-border)] bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-black text-[var(--qoreva-obsidian)] [&::-webkit-details-marker]:hidden">
                        <span>Additional planning intelligence</span>
                        <span className="text-xs font-bold text-[var(--qoreva-muted)]">
                          PPE • Permits • Emergency • Stop Work • Requirements ▾
                        </span>
                      </summary>

                      <div className="space-y-4 border-t border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
                        {generatedPlanningDraft.reviewFlags.length > 0 ? (
                          <div className="grid gap-2">
                            {generatedPlanningDraft.reviewFlags.map((flag) => (
                              <div
                                key={flag.code}
                                className="rounded-xl border border-[var(--qoreva-border)] bg-white p-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                      {flag.title}
                                    </p>
                                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
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
                        ) : null}

                        {generatedPlanningDraft.requirementControlSuggestions.length >
                        0 ? (
                          <div className="rounded-xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-4">
                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                              Applicable Requirement Controls
                            </p>
                            <ul className="mt-2 space-y-2">
                              {generatedPlanningDraft.requirementControlSuggestions.map(
                                (suggestion, index) => (
                                  <li
                                    key={`${suggestion.text}-${index}`}
                                    className="flex gap-2 text-sm font-medium leading-5 text-[var(--qoreva-muted)]"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--qoreva-violet)]" />
                                    <span>{suggestion.text}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}

                        <div className="grid gap-3 lg:grid-cols-2">
                          {[
                            {
                              title: "PPE",
                              items: generatedPlanningDraft.ppeSuggestions,
                            },
                            {
                              title: "Permits / Authorizations",
                              items: generatedPlanningDraft.permitSuggestions,
                            },
                            {
                              title: "Emergency Planning",
                              items: generatedPlanningDraft.emergencySuggestions,
                            },
                            {
                              title: "Stop-Work Triggers",
                              items: generatedPlanningDraft.stopWorkSuggestions,
                            },
                          ].map((group) => (
                            <div
                              key={group.title}
                              className="rounded-xl border border-[var(--qoreva-border)] bg-white p-3"
                            >
                              <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                {group.title}
                              </p>

                              {group.items.length > 0 ? (
                                <ul className="mt-2 space-y-1.5">
                                  {group.items.map((suggestion, index) => (
                                    <li
                                      key={`${suggestion.text}-${index}`}
                                      className="flex gap-2 text-xs font-medium leading-5 text-[var(--qoreva-muted)]"
                                    >
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--qoreva-violet)]" />
                                      <span>{suggestion.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-xs font-medium text-[var(--qoreva-muted)]">
                                  No additional suggestions.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] font-bold text-[var(--qoreva-subtle)]">
                          Generator {generatedPlanningDraft.metadata.generatorVersion} • {generatedPlanningDraft.metadata.sourceDocumentCount} selected source document{generatedPlanningDraft.metadata.sourceDocumentCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </details>
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
                      Review Gaps Before Pre-Submission Review
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
                            planSpecificDocuments.length,
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
                            Draft ready for pre-submission review
                          </h3>

                          <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                            Step 7 lets the plan creator or designated preparer perform the final pre-submission check, return to earlier sections when changes are needed, resolve warnings, and confirm the plan is ready to be sent into the configured review and signature workflow.
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
              Continue to Pre-Submission Review →
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
                eyebrow="Pre-Submission Review"
                title="Final Check Before Submission"
                description="Complete the creator/preparer's final check of the assembled draft before sending it to the configured reviewer(s) for approval, signatures, and finalization. Completing this step does not approve the PTP."
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
                  label="Checks Complete"
                  value={reviewConfirmationProgress.confirmed}
                  detail={`${reviewConfirmationProgress.percent}% of pre-submission checks`}
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
                      Human confirmation before submission
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Qoreva can structure the draft, surface gaps, and recommend controls. The person completing this pre-submission review confirms that the plan reflects the work as currently planned. Formal approval occurs only after Step 8 sends the PTP through the configured reviewer and signature workflow.
                    </p>
                  </div>
                </div>
              </section>

              {generatedPlanningDraft ? (
                <section className="overflow-hidden rounded-[1.75rem] border border-[rgba(102,87,232,0.22)] bg-white shadow-[var(--qoreva-shadow-sm)]">
                  <div className="border-b border-[rgba(102,87,232,0.16)] bg-[var(--qoreva-violet-faint)] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--qoreva-violet)]">
                          Qoreva Intelligence
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                          Pre-Submission Review Intelligence
                        </h3>

                        <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          Review the planning intelligence carried forward from the Draft Builder before sending the PTP for formal review. Qoreva recommendations are advisory and do not replace qualified professional judgment.
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

                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.metadata.sourceDocumentCount} Sources`}
                          tone={
                            generatedPlanningDraft.metadata.sourceDocumentCount > 0
                              ? "success"
                              : "neutral"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-6">
                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                            Qoreva Review Flags
                          </p>

                          <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                            These flags explain where the generated draft deserves additional attention before submission.
                          </p>
                        </div>

                        <DocumentStatusBadge
                          label={`${generatedPlanningDraft.reviewFlags.length} Flag${
                            generatedPlanningDraft.reviewFlags.length === 1
                              ? ""
                              : "s"
                          }`}
                          tone={
                            generatedPlanningDraft.reviewFlags.some(
                              (flag) => flag.severity === "Critical",
                            )
                              ? "danger"
                              : generatedPlanningDraft.reviewFlags.some(
                                    (flag) =>
                                      flag.severity === "Warning" ||
                                      flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" ||
                                      flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT",
                                  )
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </div>

                      {generatedPlanningDraft.reviewFlags.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                          {generatedPlanningDraft.reviewFlags
                            .filter(
                              (flag) =>
                                !(
                                  flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" &&
                                  unresolvedUserHazardReviewItems.length === 0
                                ) &&
                                !(
                                  flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT" &&
                                  unassignedUserControlReviewItems.length === 0
                                ),
                            )
                            .map((flag) => (
                            <div
                              key={flag.code}
                              className={`rounded-2xl border p-4 ${
                                flag.severity === "Critical" ||
                                flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" ||
                                flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT"
                                  ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
                                  : flag.severity === "Warning"
                                    ? "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)]"
                                    : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                              }`}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-black text-[var(--qoreva-obsidian)]">
                                    {flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW"
                                      ? "Hazards need assigned controls"
                                      : flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT"
                                        ? "Controls need hazard assignment"
                                        : flag.title}
                                  </p>

                                  <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                                    {flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW"
                                      ? `${unresolvedUserHazardReviewItems.length} user-entered hazard${unresolvedUserHazardReviewItems.length === 1 ? "" : "s"} still ${unresolvedUserHazardReviewItems.length === 1 ? "needs" : "need"} at least one appropriate control. Resolve the relationship in Build Plan before submission.`
                                      : flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT"
                                        ? `${unassignedUserControlReviewItems.length} user-entered control${unassignedUserControlReviewItems.length === 1 ? "" : "s"} still ${unassignedUserControlReviewItems.length === 1 ? "needs" : "need"} a specific hazard assignment. Qoreva will not guess this relationship.`
                                        : flag.detail}
                                  </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  <DocumentStatusBadge
                                    label={
                                      flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" ||
                                      flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT"
                                        ? "Action Required"
                                        : flag.severity === "Warning"
                                          ? "Review Recommended"
                                          : flag.severity
                                    }
                                    tone={
                                      flag.severity === "Critical" ||
                                      flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" ||
                                      flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT"
                                        ? "danger"
                                        : flag.severity === "Warning"
                                          ? "warning"
                                          : "neutral"
                                    }
                                  />

                                  {flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" &&
                                  unresolvedUserHazardReviewItems.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        guideToUnresolvedHazard(
                                          unresolvedUserHazardReviewItems[0].hazard.id,
                                        )
                                      }
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--qoreva-danger)] px-3.5 py-2 text-xs font-black text-white transition hover:opacity-90"
                                    >
                                      Review in Build Plan →
                                    </button>
                                  ) : flag.code === "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT" &&
                                    unassignedUserControlReviewItems.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={guideToControlAssignmentReview}
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--qoreva-danger)] px-3.5 py-2 text-xs font-black text-white transition hover:opacity-90"
                                    >
                                      Review in Build Plan →
                                    </button>
                                  ) : null}
                                </div>
                              </div>

                              {flag.code === "USER_HAZARDS_NEED_CONTROL_REVIEW" &&
                              unresolvedUserHazardReviewItems.length > 0 ? (
                                <div className="mt-3 grid gap-2">
                                  {unresolvedUserHazardReviewItems.map((item) => (
                                    <button
                                      key={`${item.stepSequence}-${item.hazard.id}`}
                                      type="button"
                                      onClick={() =>
                                        guideToUnresolvedHazard(item.hazard.id)
                                      }
                                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#F0BDC4] bg-white px-3 py-2 text-left transition hover:bg-[#FFF7F8]"
                                    >
                                      <span className="min-w-0">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.07em] text-[var(--qoreva-danger)]">
                                          Work Step {item.stepSequence}
                                        </span>
                                        <span className="mt-0.5 block text-xs font-bold text-[var(--qoreva-obsidian)]">
                                          {item.hazard.text}
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-xs font-black text-[var(--qoreva-danger)]">
                                        Review →
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-[#B8DFC9] bg-[var(--qoreva-success-soft)] p-4">
                          <p className="font-black text-[var(--qoreva-obsidian)]">
                            No generation flags remain.
                          </p>

                          <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                            Qoreva did not surface additional draft-generation concerns. The person completing the pre-submission review still verifies the complete plan before it is sent for formal review.
                          </p>
                        </div>
                      )}
                    </div>

                    {generatedPlanningDraft.workSteps.some(
                      (step) =>
                        step.riskAttention === "HighAttention" ||
                        step.riskAttention === "Elevated",
                    ) ? (
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
                          Generated Work-Step Attention
                        </p>

                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {generatedPlanningDraft.workSteps
                            .filter(
                              (step) =>
                                step.riskAttention === "HighAttention" ||
                                step.riskAttention === "Elevated",
                            )
                            .map((step) => (
                              <div
                                key={`review-intelligence-${step.sequence}-${step.title}`}
                                className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                                      Work Step {step.sequence}
                                    </p>

                                    <p className="mt-1 font-black text-[var(--qoreva-obsidian)]">
                                      {step.title}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <DocumentStatusBadge
                                      label={step.riskAttention}
                                      tone="warning"
                                    />

                                    {step.safetyCriticalSuggested ? (
                                      <DocumentStatusBadge
                                        label="Safety Critical Suggested"
                                        tone="danger"
                                      />
                                    ) : null}
                                  </div>
                                </div>

                                {step.sourceActivityCodes.length > 0 ? (
                                  <p className="mt-3 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    Activity basis:{" "}
                                    {step.sourceActivityCodes.join(", ")}
                                  </p>
                                ) : (
                                  <p className="mt-3 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    Qoreva could not map this work step to a confirmed activity with sufficient confidence. Verify the step manually.
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}

                    {generatedPlanningDraft.requirementControlSuggestions.length > 0 ? (
                      <div className="rounded-2xl border border-[rgba(102,87,232,0.2)] bg-[var(--qoreva-violet-faint)] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                              Requirement Pack Intelligence
                            </p>

                            <h4 className="mt-1 font-black text-[var(--qoreva-obsidian)]">
                              Applicable Requirement Controls
                            </h4>

                            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                              These controls came from applicable requirement rules. The person completing the pre-submission review confirms they are addressed in the plan before it is sent for formal review.
                            </p>
                          </div>

                          <DocumentStatusBadge
                            label={`${generatedPlanningDraft.requirementControlSuggestions.length} Control${
                              generatedPlanningDraft.requirementControlSuggestions.length === 1
                                ? ""
                                : "s"
                            }`}
                            tone="success"
                          />
                        </div>

                        <div className="mt-4 grid gap-2">
                          {generatedPlanningDraft.requirementControlSuggestions.map(
                            (suggestion, index) => (
                              <div
                                key={`qualified-requirement-${suggestion.text}-${index}`}
                                className="rounded-xl border border-[rgba(102,87,232,0.16)] bg-white p-3"
                              >
                                <p className="text-sm font-semibold leading-6 text-[var(--qoreva-obsidian)]">
                                  {suggestion.text}
                                </p>

                                {suggestion.sourceRequirementIds.length > 0 ? (
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--qoreva-muted)]">
                                    Requirement source count:{" "}
                                    {suggestion.sourceRequirementIds.length}
                                  </p>
                                ) : null}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          No Requirement Pack controls generated
                        </p>

                        <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                          No generated requirement controls are attached to this draft. Review the project requirements and source context before confirming the requirement review.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          Generation Trace
                        </p>

                        <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                          {generatedPlanningDraft.metadata.generatorVersion} • Generated{" "}
                          {new Date(
                            generatedPlanningDraft.generatedAt,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-xs font-bold text-[var(--qoreva-muted)]">
                        Qoreva assists. Qualified people make final decisions.
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B97917] text-xs font-black text-white">
                      !
                    </div>

                    <div>
                      <h3 className="font-black text-[var(--qoreva-obsidian)]">
                        Draft intelligence is not loaded
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        Return to Build Plan and regenerate the current draft before completing pre-submission review.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Revision Comments
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Pre-Submission Issues & Requested Changes
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Add comments directly to the specific field or work item that needs correction. Open comments remain attached to that target so the preparer can return directly to the issue instead of searching through the plan.
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
                      Resolve Action Required items before submission. Review Recommended items may proceed only after the preparer confirms the condition is acceptable or returns to the applicable section to update the plan.
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
                        Pre-Submission Review Copy
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
                        Pre-Submission Review
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
                    Creator / Preparer Confirmation
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                    Confirm the PTP is ready to send
                  </h3>

                  <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                    These confirmations document the creator/preparer's final check. They do not approve the PTP and they are not the downstream reviewer signatures. Step 8 sends the plan into the configured review and signature workflow.
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
                    detail="Foreseeable exposures, including serious-injury/fatality potential, were considered before submission."
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
                    detail="Applicable project/owner requirements and the status of available source documents were considered before submission."
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
                    label="Pre-Submission Reviewed By"
                    value={reviewerName}
                    placeholder="Enter name"
                    onChange={(value) => {
                      setReviewerName(value);
                      setStepError("");
                    }}
                  />

                  <TextControl
                    label="Role / Title"
                    value={reviewerRole}
                    placeholder="Example: Safety Manager"
                    onChange={(value) => {
                      setReviewerRole(value);
                      setStepError("");
                    }}
                  />

                  <div className="md:col-span-2">
                    <TextareaControl
                      label="Pre-Submission Notes"
                      value={reviewNotes}
                      rows={4}
                      placeholder="Document final pre-submission notes, accepted warnings, follow-up items, or context for the downstream reviewer."
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
                      Next: Submit for Review & Signatures
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Step 8 will create the submission package and send the PTP into the configured review and signature workflow. Required reviewer/approver roles come from Qoreva baseline routing and applicable Requirement Packs; the PTP is not finalized until that workflow is completed.
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
                ? "Saving Pre-Submission Review..."
                : "Continue to Submit for Review & Signatures →"}
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
                eyebrow="Submit for Review & Signatures"
                title="Submit the Planning Record for Review"
                description="Confirm the final submission package and send this revision into the configured approval workflow. Qoreva snapshots the required approval route, creates the pending approval records, preserves the submission timestamp and revision reference, and keeps the PTP pending until the required review and signature workflow is completed."
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
                  label="Required Approvals"
                  value={submissionSignatureSummary.required}
                  detail="Configured required roles"
                  tone="neutral"
                />

                <StepMetric
                  label="Approval Roles"
                  value={submissionSignatureSummary.total}
                  detail="Resolved route for this revision"
                  tone={
                    submissionSignatureSummary.total > 0
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

              {!submitted ? (
                <section
                  className={`rounded-2xl border p-5 ${
                    submissionReadinessLoading
                      ? "border-[var(--qoreva-border)] bg-white"
                      : submissionReadinessError
                        ? "border-[#E7D8A5] bg-[#FFFBEA]"
                        : submissionReadiness?.ready
                          ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                          : submissionReadiness
                            ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
                            : "border-[var(--qoreva-border)] bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        submissionReadinessLoading
                          ? "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]"
                          : submissionReadinessError
                            ? "bg-[#D69E2E] text-white"
                            : submissionReadiness?.ready
                              ? "bg-[var(--qoreva-success)] text-white"
                              : submissionReadiness
                                ? "bg-[var(--qoreva-danger)] text-white"
                                : "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]"
                      }`}
                    >
                      {submissionReadinessLoading
                        ? "…"
                        : submissionReadinessError
                          ? "!"
                          : submissionReadiness?.ready
                            ? "✓"
                            : submissionReadiness
                              ? "!"
                              : "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-[var(--qoreva-obsidian)]">
                        {submissionReadinessLoading
                          ? "Checking Submission Readiness..."
                          : submissionReadinessError
                            ? "Readiness Check Unavailable"
                            : submissionReadiness?.ready
                              ? "Ready to Submit for Review"
                              : submissionReadiness
                                ? "Action Required"
                                : "Submission Readiness"}
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        {submissionReadinessLoading
                          ? "Qoreva is checking the applicable submission requirements for this planning record."
                          : submissionReadinessError
                            ? "Qoreva could not load the readiness preview. This does not mean the plan failed compliance. Final submission will still be validated by the server."
                            : submissionReadiness?.ready
                              ? "All applicable submission-blocking requirements currently evaluated by Qoreva are satisfied."
                              : submissionReadiness
                                ? `${submissionReadiness.compliance.summary.submissionBlocking} submission requirement${
                                    submissionReadiness.compliance.summary.submissionBlocking === 1
                                      ? ""
                                      : "s"
                                  } need${
                                    submissionReadiness.compliance.summary.submissionBlocking === 1
                                      ? "s"
                                      : ""
                                  } attention before this plan can be submitted.`
                                : "Submission readiness has not been checked yet."}
                      </p>

                      {submissionReadinessError &&
                      planningRecordId ? (
                        <button
                          type="button"
                          onClick={() => {
                            void loadSubmissionReadiness(
                              planningRecordId,
                            ).catch(() => {
                              /*
                               * The retry result is surfaced
                               * through readiness state.
                               */
                            });
                          }}
                          disabled={submissionReadinessLoading}
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#E7D8A5] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-obsidian)] transition hover:bg-[#FFF7D6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submissionReadinessLoading
                            ? "Checking..."
                            : "Retry Readiness Check"}
                        </button>
                      ) : null}

                      {submissionReadiness &&
                      !submissionReadiness.ready &&
                      submissionReadiness.compliance.blockers.length >
                        0 ? (
                        <div className="mt-4 space-y-3">
                          {submissionReadiness.compliance.blockers.map(
                            (blocker) => (
                              <div
                                key={`${blocker.requirementRuleCode}-${blocker.questionCode}`}
                                className="rounded-xl border border-[#F0BDC4] bg-white p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                      {blocker.requirementTitle}
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-[var(--qoreva-muted)]">
                                      Source:{" "}
                                      {blocker.requirementPackName}
                                      {blocker.organizationName
                                        ? ` • ${blocker.organizationName}`
                                        : ""}
                                    </p>
                                  </div>

                                  <span className="w-fit rounded-full bg-[var(--qoreva-danger-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-danger)]">
                                    Action Required
                                  </span>
                                </div>

                                <div className="mt-3 rounded-xl bg-[var(--qoreva-surface-muted)] p-3">
                                  <p className="text-xs font-black text-[var(--qoreva-text)]">
                                    {blocker.questionText}
                                  </p>

                                  {blocker.message ? (
                                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                      {blocker.message}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      guideToRequirementQuestion(
                                        blocker.questionCode,
                                      )
                                    }
                                    className="
                                      inline-flex
                                      min-h-10
                                      items-center
                                      justify-center
                                      rounded-xl
                                      border
                                      border-[var(--qoreva-violet)]
                                      bg-[var(--qoreva-violet)]
                                      px-4
                                      py-2
                                      text-xs
                                      font-black
                                      text-white
                                      transition
                                      hover:bg-[var(--qoreva-violet-dark)]
                                    "
                                  >
                                    Resolve Requirement →
                                  </button>

                                  <span className="text-[10px] font-bold text-[var(--qoreva-muted)]">
                                    Opens the exact Guided Planning question.
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {submitted ? (
                <section className="rounded-2xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-success)] text-sm font-black text-white">
                      ✓
                    </div>

                    <div>
                      <h3 className="font-black text-[var(--qoreva-success)]">
                        Submitted for review
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-text)]">
                        Submitted on{" "}
                        {submittedAt
                          ? formatDateTime(
                              submittedAt,
                            )
                          : "the current session"}.
                        Qoreva has preserved this revision and created its pending approval workflow. This PTP is submitted, but it is not yet approved or effective.
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
                      Qoreva resolves the Responsible Supervisor / Foreman and Qualified Reviewer as baseline roles, then adds applicable approval roles from active Requirement Packs for this tenant, project, contractor, and plan type. The Step 7 pre-submission reviewer is not automatically treated as the downstream Qualified Reviewer.
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
                          ? "Pending Review"
                          : "Ready to Submit"}
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
                        label="Pre-Submission Reviewed By"
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

              {approvalRoutingError ? (
                <section className="rounded-2xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-danger)] text-xs font-black text-white">
                      !
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-[var(--qoreva-obsidian)]">
                        Approval routing could not be loaded
                      </h3>

                      <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                        {approvalRoutingError}
                      </p>

                      {!submitted && planningRecordId ? (
                        <button
                          type="button"
                          onClick={() => {
                            void loadApprovalRouting(
                              planningRecordId,
                            );
                          }}
                          disabled={approvalRoutingLoading}
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F0BDC4] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approvalRoutingLoading
                            ? "Reloading Approval Routing..."
                            : "Reload Approval Routing"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Approval Workflow
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      Review & Signature Route
                    </h3>

                    <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Qoreva resolves the required approval roles from baseline routing and applicable Requirement Packs, then limits each role to eligible project users. Confirm who should receive each required approval before submission. Reviewers complete approval and signature actions downstream; the creator does not sign on their behalf.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentStatusBadge
                      label={`${submissionSignatureSummary.required} Required Approval${
                        submissionSignatureSummary.required === 1
                          ? ""
                          : "s"
                      }`}
                      tone="warning"
                    />

                    <DocumentStatusBadge
                      label={`${submissionSignatureSummary.total} Route Role${
                        submissionSignatureSummary.total === 1
                          ? ""
                          : "s"
                      }`}
                      tone={
                        submissionSignatureSummary.total > 0
                          ? "success"
                          : "warning"
                      }
                    />

                    {!submitted ? (
                      <DocumentStatusBadge
                        label={`${approvalAssignmentSummary.confirmedRequired}/${approvalAssignmentSummary.required} Assigned`}
                        tone={
                          approvalAssignmentSummary.allRequiredConfirmed
                            ? "success"
                            : "warning"
                        }
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  {!submitted &&
                  approvalEligibilityLoading ? (
                    <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
                      <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                        Finding eligible reviewers...
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                        Qoreva is checking active project membership, approval permission, and role eligibility.
                      </p>
                    </div>
                  ) : null}

                  {!submitted &&
                  approvalEligibilityError ? (
                    <div className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4">
                      <p className="text-sm font-black text-[var(--qoreva-danger)]">
                        Reviewer assignments could not be loaded
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                        {approvalEligibilityError}
                      </p>

                      {planningRecordId ? (
                        <button
                          type="button"
                          onClick={() => {
                            void loadApprovalRouting(
                              planningRecordId,
                            );
                          }}
                          disabled={
                            approvalRoutingLoading ||
                            approvalEligibilityLoading
                          }
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F0BDC4] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-danger)] transition hover:bg-[var(--qoreva-danger-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reload Approval Workflow
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {!submitted &&
                  approvalEligibility?.roles ? (
                    <div className="grid gap-3">
                      {approvalEligibility.roles.map(
                        (
                          role,
                          index,
                        ) => {
                          const roleCode =
                            normalizeApprovalRoleCode(
                              role.roleCode,
                            );

                          const selectedUserId =
                            approvalAssignments[
                              roleCode
                            ] ?? "";

                          const selectedUser =
                            role.eligibleUsers.find(
                              (user) =>
                                user.userId ===
                                selectedUserId,
                            ) ?? null;

                          const confirmed =
                            approvalAssignmentConfirmations[
                              roleCode
                            ] === true;

                          const noEligibleUsers =
                            role.eligibleUsers
                              .length === 0;

                          const needsAction =
                            role.isRequired &&
                            (
                              noEligibleUsers ||
                              !selectedUser ||
                              !confirmed
                            );

                          return (
                            <article
                              key={
                                role.roleCode
                              }
                              className={`rounded-xl border p-4 ${
                                noEligibleUsers &&
                                role.isRequired
                                  ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]"
                                  : confirmed
                                    ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]"
                                    : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                              }`}
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white px-2 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                                      {index + 1}
                                    </span>

                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                      {
                                        role.roleLabel
                                      }
                                    </p>

                                    <span className="rounded-full bg-[var(--qoreva-violet-faint)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-violet-dark)]">
                                      {role.isRequired
                                        ? "Required"
                                        : "Optional"}
                                    </span>

                                    {needsAction ? (
                                      <DocumentStatusBadge
                                        label="Action Required"
                                        tone="danger"
                                      />
                                    ) : confirmed ? (
                                      <DocumentStatusBadge
                                        label="Assignment Confirmed"
                                        tone="success"
                                      />
                                    ) : (
                                      <DocumentStatusBadge
                                        label="Confirm Assignment"
                                        tone="warning"
                                      />
                                    )}
                                  </div>

                                  <p className="mt-2 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    {role.eligibleUserCount ===
                                    0
                                      ? "No active project user currently has both Planning approval permission and eligibility for this workflow role."
                                      : role.eligibleUserCount ===
                                          1
                                        ? "Qoreva found one eligible person and preselected them. Confirm the assignment before submission."
                                        : `Qoreva found ${role.eligibleUserCount} eligible people. Select the person who should receive this approval request.`}
                                  </p>

                                  {role.configuredSigner
                                    .name &&
                                  !role.configuredSigner
                                    .userId ? (
                                    <div className="mt-3 rounded-lg border border-[#E7D8A5] bg-[#FFFBEA] px-3 py-2">
                                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8B6A18]">
                                        Planning Entry
                                      </p>

                                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                        {
                                          role
                                            .configuredSigner
                                            .name
                                        }{" "}
                                        was entered in the plan, but that typed name is not treated as authenticated approval authority. Select and confirm an eligible Qoreva identity.
                                      </p>
                                    </div>
                                  ) : null}

                                  {role.eligibleUsers
                                    .length > 0 ? (
                                    <div className="mt-4">
                                      <label
                                        htmlFor={`approval-assignment-${roleCode}`}
                                        className="mb-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]"
                                      >
                                        Assigned
                                        Person
                                      </label>

                                      <select
                                        id={`approval-assignment-${roleCode}`}
                                        value={
                                          selectedUserId
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          changeApprovalAssignment(
                                            roleCode,
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        disabled={
                                          submitted
                                        }
                                        className={fieldClassName}
                                      >
                                        <option value="">
                                          Select eligible person
                                        </option>

                                        {role.eligibleUsers.map(
                                          (
                                            user,
                                          ) => (
                                            <option
                                              key={
                                                user.userId
                                              }
                                              value={
                                                user.userId
                                              }
                                            >
                                              {
                                                user.displayName
                                              }{" "}
                                              —{" "}
                                              {
                                                user.email
                                              }
                                            </option>
                                          ),
                                        )}
                                      </select>

                                      {selectedUser ? (
                                        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--qoreva-border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                              {
                                                selectedUser.displayName
                                              }
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                                              {
                                                selectedUser.email
                                              }
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              confirmApprovalAssignment(
                                                roleCode,
                                              )
                                            }
                                            disabled={
                                              confirmed ||
                                              submitted
                                            }
                                            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed ${
                                              confirmed
                                                ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                                                : "border-[var(--qoreva-violet)] bg-[var(--qoreva-violet)] text-white hover:bg-[var(--qoreva-violet-dark)]"
                                            }`}
                                          >
                                            {confirmed
                                              ? "Assignment Confirmed ✓"
                                              : "Confirm Assignment"}
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-white p-3">
                                      <p className="text-xs font-black text-[var(--qoreva-danger)]">
                                        Eligible project member required
                                      </p>

                                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                        A project administrator must assign an active Qoreva user the appropriate Planning approval permission and workflow role before this plan can be submitted.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  ) : null}

                  {submitted ? (
                    <div className="grid gap-3">
                      {submissionSignatures.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-4">
                          <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                            Submitted approval workflow
                          </p>

                          <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                            The approval workflow has been created for this revision.
                          </p>
                        </div>
                      ) : (
                        submissionSignatures.map(
                          (
                            approvalRole,
                            index,
                          ) => (
                            <article
                              key={
                                approvalRole.id
                              }
                              className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white px-2 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
                                      {index + 1}
                                    </span>

                                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                      {
                                        approvalRole.role
                                      }
                                    </p>

                                    <span className="rounded-full bg-[var(--qoreva-violet-faint)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-violet-dark)]">
                                      {approvalRole.required
                                        ? "Required"
                                        : "Optional"}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-xs font-bold text-[var(--qoreva-muted)]">
                                    {approvalRole.signerName
                                      ? `Assigned: ${approvalRole.signerName}`
                                      : "Assigned reviewer unavailable in this browser state"}
                                  </p>
                                </div>

                                <DocumentStatusBadge
                                  label="Pending Review"
                                  tone="warning"
                                />
                              </div>
                            </article>
                          ),
                        )
                      )}
                    </div>
                  ) : null}
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
                      Submission acknowledgement
                    </span>

                    <span className="mt-1 block text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                      I confirm the pre-submission review is complete, open revision comments have been resolved, the required approval assignments shown above are correct, and this planning record is ready to enter the configured downstream review and signature workflow.
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
                        ? "Submitted for Review"
                        : "Submit for Review"}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      {submitted
                        ? "This revision is now pending the configured downstream approval and signature workflow."
                        : "Zero open review comments, a valid approval route, confirmed required reviewer assignments, server submission readiness, and the submission acknowledgement are required before this revision can enter review."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={submitPlanningRecord}
                    disabled={
                      submitted ||
                      submissionSaving ||
                      approvalRoutingLoading ||
                      approvalEligibilityLoading ||
                      approvalAssignmentSummary.unresolvedRequired >
                        0 ||
                      Boolean(
                        approvalRoutingError,
                      ) ||
                      Boolean(
                        approvalEligibilityError,
                      )
                    }
                    className={`
                      ${primaryButtonClassName}
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    `}
                  >
                    {submissionSaving
                      ? "Submitting for Review..."
                      : submitted
                        ? "Submitted for Review ✓"
                        : "Submit for Review →"}
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
              ← Back to Pre-Submission Review
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

function formatRequirementSourceLabel(
  source: RequirementQuestionSource,
) {
  const normalizedPackType =
    source.packType
      .trim()
      .toLowerCase();

  if (
    normalizedPackType === "federal" ||
    normalizedPackType === "osha"
  ) {
    return "Federal / OSHA";
  }

  if (
    normalizedPackType === "state" ||
    normalizedPackType === "stateplan" ||
    normalizedPackType === "state_plan" ||
    normalizedPackType === "state plan"
  ) {
    return "State Plan";
  }

  if (normalizedPackType === "owner") {
    return "Owner Requirement";
  }

  if (
    normalizedPackType === "gc" ||
    normalizedPackType === "generalcontractor" ||
    normalizedPackType === "general_contractor" ||
    normalizedPackType === "general contractor"
  ) {
    return "GC Requirement";
  }

  if (normalizedPackType === "company") {
    return "Company Requirement";
  }

  if (normalizedPackType === "project") {
    return "Project Requirement";
  }

  if (normalizedPackType === "qoreva") {
    return "Qoreva Requirement";
  }

  return "Requirement";
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
  highestReachedStep,
  onNavigate,
}: {
  currentStep: number;
  highestReachedStep: number;
  onNavigate: (step: number) => void;
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
              Step {currentStep} of 8
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

              const available =
                step.number <=
                highestReachedStep;

              const completed =
                step.number <
                highestReachedStep;

              return (
                <div
                  key={step.number}
                  className="
                    relative
                    flex
                    flex-1
                    items-start
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        available &&
                        !active
                      ) {
                        onNavigate(
                          step.number,
                        );
                      }
                    }}
                    disabled={!available}
                    aria-current={
                      active
                        ? "step"
                        : undefined
                    }
                    title={
                      active
                        ? `Currently on ${step.shortTitle}`
                        : available
                          ? `Go to ${step.shortTitle}`
                          : `${step.shortTitle} has not been reached yet`
                    }
                    className={`
                      relative
                      z-10
                      flex
                      min-w-[76px]
                      flex-col
                      items-center
                      rounded-xl
                      px-2
                      py-1.5
                      text-center
                      transition-all
                      duration-150

                      ${
                        available &&
                        !active
                          ? `
                            cursor-pointer
                            hover:bg-[var(--qoreva-surface-muted)]
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--qoreva-violet)]
                            focus-visible:ring-offset-2
                          `
                          : ""
                      }

                      ${
                        !available
                          ? `
                            cursor-not-allowed
                            opacity-55
                          `
                          : ""
                      }
                    `}
                  >
                    <span
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
                        transition-all
                        duration-150

                        ${
                          active
                            ? `
                              border-[var(--qoreva-violet)]
                              bg-[var(--qoreva-violet)]
                              text-white
                              ring-4
                              ring-[rgba(102,87,232,0.08)]
                            `
                            : completed
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
                      {completed &&
                      !active ? (
                        <CheckIcon />
                      ) : (
                        step.number
                      )}
                    </span>

                    <span
                      className={`
                        mt-2
                        max-w-24
                        text-[10px]
                        font-black
                        transition-colors

                        ${
                          active
                            ? "text-[var(--qoreva-violet-dark)]"
                            : completed
                              ? "text-[var(--qoreva-success)]"
                              : "text-[var(--qoreva-muted)]"
                        }
                      `}
                    >
                      {step.shortTitle}
                    </span>
                  </button>

                  {index <
                  wizardSteps.length -
                    1 ? (
                    <div
                      aria-hidden="true"
                      className={`
                        mt-[21px]
                        h-px
                        flex-1

                        ${
                          step.number <
                          highestReachedStep
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

      {highestReachedStep > 1 ? (
        <div
          className="
            border-t
            border-[var(--qoreva-border)]
            bg-[var(--qoreva-surface-muted)]
            px-5
            py-2.5
            sm:px-6
          "
        >
          <p className="text-center text-[10px] font-bold text-[var(--qoreva-muted)]">
            Select a completed step to review or update that section.
          </p>
        </div>
      ) : null}
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
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "date" | "number";
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
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
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
  disabled = false,
  onSign,
  onClear,
  onRemove,
}: {
  signature: SubmissionSignature;
  disabled?: boolean;
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
                disabled={disabled}
                className="rounded-lg border border-[#F0D5A4] bg-white px-3 py-2 text-xs font-black text-[#9B6212] transition hover:bg-[var(--qoreva-warning-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {disabled
                  ? "Signature Locked"
                  : "Clear Signature"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setSignatureOpen(true)
                }
                disabled={
                  disabled ||
                  !signature.signerName.trim()
                }
                className="rounded-lg border border-[#BDE8D4] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-success)] transition hover:bg-[var(--qoreva-success-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {disabled
                  ? "Read Only"
                  : "Draw Signature"}
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

      {signatureOpen &&
      !disabled ? (
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