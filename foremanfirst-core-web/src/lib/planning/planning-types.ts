export type PlanningActivityContext = {
  activityCode: string;
  name: string;
  category: string | null;
  isHighRisk: boolean;
  detectionSource: string;
  confidence: number | null;
};

export type PlanningQuestionAnswerContext = {
  questionCode: string;
  category: string;
  section: string | null;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  isCritical: boolean;
  responseValue: string | null;
  notes: string | null;
};

export type PlanningWorkStepContext = {
  sequence: number;
  title: string;
  description: string | null;
  hazards: string | null;
  controls: string | null;
  safetyCritical: boolean;
  riskLevel: string | null;
};

export type PlanningRequirementContext = {
  id: string;
  name: string;
  description: string | null;
  sourceType: string;
  sourceOrganization: string | null;
  severity: string | null;
  requirementText: string;
  requiredInformation: unknown;
  requiredControls: unknown;
  sourceDocumentName: string | null;
  sourcePage: string | null;
};

export type PlanningSourceDocumentContext = {
  id: string;
  documentType: string;
  documentName: string;
  fileName: string;
  approvalStatus: string;
  reviewStatus: string;
  aiProcessingStatus: string;
  aiDocumentType: string | null;
  aiConfidence: number | null;
};

export type PlanningGenerationContext = {
  planningRecordId: string;
  tenantId: string;

  planType: string;
  title: string;
  status: string;
  revisionNumber: number;

  project: {
    id: string;
    name: string;
    projectCode: string | null;
    clientName: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
  };

  contractor: {
    id: string | null;
    name: string | null;
    trade: string | null;
  };

  assignment: {
    responsibleSupervisor: string | null;
    plannedStartDate: string | null;
    workLocation: string | null;
    crewSize: number | null;
    shift: string | null;
  };

  scope: {
    description: string | null;
    equipmentTools: string | null;
    materialsChemicals: string | null;
    adjacentWork: string | null;
    specialConditions: string | null;
  };

  activities: PlanningActivityContext[];

  questions: PlanningQuestionAnswerContext[];

  workSteps: PlanningWorkStepContext[];

  requirements: PlanningRequirementContext[];

  sourceDocuments: PlanningSourceDocumentContext[];

  existingControls: {
    requiredPpe: string | null;
    requiredPermits: string | null;
    emergencyPlan: string | null;
    stopWorkTriggers: string | null;
    planningNotes: string | null;
  };
};

export type DraftGenerationSource =
  | "User"
  | "Rule"
  | "Requirement"
  | "AI";

/**
 * A single hazard or control generated for a work step.
 *
 * The ID is an internal identifier used to preserve the
 * relationship between hazards and controls. The interface
 * should not depend on display numbering such as H1/H1.a.
 */
export type GeneratedHazardControlItem = {
  id: string;

  text: string;

  source: DraftGenerationSource;

  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];

  /**
   * True when this item originates from an applicable
   * mandatory requirement rather than general planning
   * assistance.
   *
   * Requirement-backed items should not be silently removed
   * from the official planning workflow.
   */
  required: boolean;
};

/**
 * Represents an explicit hazard-to-control relationship.
 *
 * A hazard contains the controls intended to mitigate that
 * specific hazard rather than relying on separate unrelated
 * hazard and control lists.
 */
export type GeneratedHazardControlGroup = {
  id: string;

  hazard: GeneratedHazardControlItem;

  controls: GeneratedHazardControlItem[];
};

export type DraftWorkStepSuggestion = {
  sequence: number;
  title: string;
  description: string | null;

  /**
   * Legacy generated arrays.
   *
   * These remain temporarily for compatibility with existing
   * generated planning drafts and saved revisions while
   * Work-Step Intelligence migrates to structured
   * hazard-control relationships.
   */
  suggestedHazards: string[];

  suggestedControls: string[];

  /**
   * Structured Work-Step Intelligence.
   *
   * Each hazard explicitly owns the controls associated with
   * that hazard.
   */
  hazardControlGroups: GeneratedHazardControlGroup[];

  safetyCriticalSuggested: boolean;

  /**
   * Qoreva may identify potential risk significance,
   * but the qualified user remains responsible for
   * assigning and approving the official risk rating.
   */
  riskAttention:
    | "Normal"
    | "Elevated"
    | "HighAttention";

  source: DraftGenerationSource;

  sourceActivityCodes: string[];

  sourceQuestionCodes: string[];

  sourceRequirementIds: string[];
};

export type DraftControlSuggestion = {
  text: string;

  source: DraftGenerationSource;

  sourceActivityCodes: string[];

  sourceQuestionCodes: string[];

  sourceRequirementIds: string[];
};

export type PlanningDraftGenerationResult = {
  generatedAt: string;

  /**
   * Work-step-specific planning intelligence.
   *
   * These are suggestions only. They do not replace
   * qualified-user review or the official work-step
   * risk assessment.
   */
  workSteps: DraftWorkStepSuggestion[];

  /**
   * Suggested PPE derived from applicable planning
   * activities and rules.
   */
  ppeSuggestions: DraftControlSuggestion[];

  /**
   * Suggested permits or planning authorizations.
   */
  permitSuggestions: DraftControlSuggestion[];

  /**
   * Suggested emergency-planning considerations.
   */
  emergencySuggestions: DraftControlSuggestion[];

  /**
   * Suggested conditions that may warrant stopping
   * work and reassessing the plan.
   */
  stopWorkSuggestions: DraftControlSuggestion[];

  /**
   * Controls originating from applicable Requirement
   * Pack rules.
   *
   * These intentionally remain separate from generic
   * stop-work suggestions because an owner, GC,
   * company, tenant, or project requirement does not
   * automatically represent a stop-work condition.
   *
   * The qualified user reviews these controls and
   * determines where they belong in the official plan.
   */
  requirementControlSuggestions:
    DraftControlSuggestion[];

  /**
   * Items requiring additional qualified review before
   * the generated draft should be relied upon.
   */
  reviewFlags: Array<{
    code: string;
    title: string;
    detail: string;

    severity:
      | "Info"
      | "Warning"
      | "Critical";
  }>;

  /**
   * Generation metadata provides traceability and
   * supports future audit/versioning requirements.
   */
  metadata: {
    activityCount: number;
    questionCount: number;
    requirementCount: number;
    sourceDocumentCount: number;
    generatorVersion: string;
  };
};