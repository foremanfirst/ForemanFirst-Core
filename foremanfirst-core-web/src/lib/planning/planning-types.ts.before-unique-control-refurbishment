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
  /**
   * Stable PlanningWorkStep identity.
   *
   * Sequence and title are snapshots only and must not be used as the
   * authoritative identity for new Qoreva planning relationships.
   */
  workStepId: string | null;

  sequence: number;
  title: string;
  description: string | null;
  hazards: string | null;
  controls: string | null;
  safetyCritical: boolean;

  /**
   * Legacy compatibility risk field.
   * New Qoreva planning logic must prefer the explicit risk model.
   */
  riskLevel: string | null;

  /**
   * Planner-confirmed risk before planned controls are credited.
   */
  inherentRiskLevel: string | null;

  /**
   * Qoreva-generated post-control risk recommendation.
   * This is advisory until confirmed by a qualified planner.
   */
  recommendedControlledRiskLevel: string | null;

  /**
   * Qualified-planner confirmed post-control risk.
   */
  controlledRiskLevel: string | null;
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
  sourceType: string;
  label: string | null;

  contractorDocumentId: string | null;

  documentType: string | null;
  documentName: string | null;

  fileName: string | null;
  mimeType: string | null;

  approvalStatus: string | null;
  reviewStatus: string | null;

  aiProcessingStatus: string;
  aiDocumentType: string | null;
  aiConfidence: number | null;

  isAiReady: boolean;
};

export type PlanningHazardControlDecisionType =
  | "Assign"
  | "Accept"
  | "Modify"
  | "NotApplicable";

export type PlanningHazardControlDecisionItemType =
  | "Hazard"
  | "Control";

export type PlanningHazardControlDecisionContext = {
  id: string;
  revisionNumber: number;

  /**
   * Stable PlanningWorkStep identity that owns this
   * qualified-user decision.
   *
   * Nullable only for legacy decisions created before
   * work-step-scoped decision identity was introduced.
   * Sequence/title are provenance snapshots only and
   * must never replace workStepId as authoritative identity.
   */
  workStepId: string | null;
  workStepSequence: number | null;
  workStepTitle: string | null;

  /**
   * Stable generated-item identity used to reconnect
   * a qualified-user decision to the same generated
   * hazard or control during future draft generation.
   */
  recommendationId: string;

  itemType:
    PlanningHazardControlDecisionItemType;

  /**
   * Exact text that existed when the decision was made.
   * Preserved for traceability and audit history.
   */
  originalText: string;

  decision:
    PlanningHazardControlDecisionType;

  /**
   * Qualified-user replacement text when the decision
   * is Modify.
   */
  modifiedText: string | null;

  /**
   * Generated hazard item ID selected by the user when
   * assigning a control to a specific hazard.
   */
  targetHazardId: string | null;

  /**
   * All hazards explicitly selected by the qualified user.
   * Exactly one target should be primary when an Assign
   * decision has at least one valid relationship.
   */
  targetHazards: Array<{
    hazardId: string;
    isPrimary: boolean;
  }>;

  /**
   * Optional semantic relationship identity.
   *
   * Kept as a string in this shared planning contract
   * so this file does not depend directly on the
   * canonical hazard-control library implementation.
   */
  canonicalHazardConceptId: string | null;

  sourceType: string | null;

  /**
   * Additional persisted provenance associated with
   * the qualified-user decision.
   */
  sourceMetadata: unknown;

  decidedById: string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt: string;
};

export type PlanningHazardControlOverrideItemType =
  | "Hazard"
  | "Control";

export type PlanningHazardControlOverrideAction =
  | "Add"
  | "Edit"
  | "Change"
  | "Remove";

export type PlanningHazardControlOverrideContext = {
  id: string;
  revisionNumber: number;

  /**
   * Stable revision-scoped logical identity for this
   * user-authored operation.
   *
   * Reusing the same operationKey makes saves
   * idempotent and allows later edits to update the
   * same logical override rather than duplicating it.
   */
  operationKey: string;

  /**
   * Stable draft work-step identity.
   *
   * This is intentionally not a PlanningWorkStep
   * database foreign key because Guided Intake work
   * steps can exist before final work-step persistence.
   */
  workStepId: string;
  workStepSequence: number | null;
  workStepTitle: string | null;

  itemType:
    PlanningHazardControlOverrideItemType;

  /**
   * Add:
   *   Qualified user creates a new hazard/control.
   *
   * Edit:
   *   Qualified user changes wording while preserving
   *   the existing semantic identity.
   *
   * Change:
   *   Qualified user changes/resolves the semantic
   *   identity of an existing hazard.
   *
   * Remove:
   *   Qualified user removes user-authored draft
   *   content. Generated/requirement-backed content
   *   should generally use NotApplicable in the
   *   decision layer instead of destructive removal.
   */
  action:
    PlanningHazardControlOverrideAction;

  /**
   * Stable generated or user-authored item identity
   * being changed.
   *
   * Null for Add operations.
   */
  targetItemId: string | null;

  /**
   * Controls are explicitly scoped to their parent
   * hazard.
   */
  parentHazardId: string | null;

  /**
   * Exact source wording before a user-authored
   * change.
   *
   * Null for newly added items.
   */
  originalText: string | null;

  /**
   * Final qualified-user wording for Add/Edit/Change.
   *
   * Null for Remove operations.
   */
  finalText: string | null;

  /**
   * Canonical semantic identity when safely known.
   *
   * Custom hazards may intentionally remain null.
   */
  canonicalHazardConceptId: string | null;

  /**
   * Original item provenance, such as User, Rule,
   * Requirement, or Qoreva-generated intelligence.
   */
  sourceType: string | null;

  /**
   * Additional source/provenance metadata preserved
   * for audit and future Sources & Requirement Details
   * display.
   */
  sourceMetadata: unknown;

  /**
   * Optional qualified-user explanation for a material
   * change or removal.
   */
  reason: string | null;

  changedById: string | null;
  changedByName: string | null;
  changedByRole: string | null;
  changedAt: string;
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

  /**
   * Qualified-user decisions applied to generated
   * hazard/control recommendations.
   *
   * These decisions act as an overlay after Qoreva's
   * deterministic hazard resolution and automatic
   * control assignment have completed.
   *
   * Persisted qualified-user decisions take precedence
   * over advisory generated relationships when the
   * working draft is rebuilt.
   */
  hazardControlDecisions:
    PlanningHazardControlDecisionContext[];

  /**
   * Qualified-user authored changes to the working
   * hazard/control content.
   *
   * This remains separate from the recommendation
   * decision layer because changing the plan itself is
   * not the same operation as accepting, modifying,
   * assigning, or marking a generated recommendation
   * Not Applicable.
   *
   * Only overrides belonging to the active formal PTP
   * revision are provided to draft generation.
   */
  hazardControlOverrides:
    PlanningHazardControlOverrideContext[];

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

export type PlanningControlHierarchy =
  | "Elimination"
  | "Substitution"
  | "Engineering"
  | "Administrative"
  | "PPE";

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
   * Structured Hierarchy of Controls classification.
   *
   * Null means Qoreva does not currently have an
   * authoritative classification for this item.
   *
   * Hazards normally remain null. Controls may carry
   * a classification from validated Qoreva planning
   * intelligence or preserved source provenance.
   */
  controlHierarchy?: PlanningControlHierarchy | null;

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

  /**
   * Stable Qoreva canonical hazard identity when this
   * relationship has been confidently resolved against the
   * canonical hazard intelligence library.
   *
   * Null/undefined means Qoreva does not currently have a
   * confirmed canonical relationship. Safety and risk
   * intelligence must not infer one from display wording.
   */
  canonicalHazardConceptId?: string | null;

  /**
   * Structured canonical hazard classification used by Qoreva
   * significance and field-presentation intelligence.
   *
   * These values are advisory metadata. They do not replace the
   * qualified user's hazard assessment or official risk decision.
   */
  canonicalHazardKind?:
    | "Hazard"
    | "Exposure"
    | "ReadinessCondition"
    | null;

  canonicalRiskAttention?:
    | "Normal"
    | "Elevated"
    | "HighAttention"
    | null;

  /**
   * Optional field-presentation metadata derived from the
   * authoritative canonical hazard definition.
   *
   * This does not change canonical safety identity. It allows
   * Qoreva to organize related concepts into a simpler field
   * conversation while preserving detailed safety intelligence.
   */
  fieldPresentationFamily?:
    | string
    | null;

  fieldPresentationRole?:
    | "Primary"
    | "Detail"
    | "Umbrella"
    | "Independent"
    | null;

  hazard: GeneratedHazardControlItem;

  controls: GeneratedHazardControlItem[];
};

export type DraftWorkStepSuggestion = {
  /**
   * Stable PlanningWorkStep identity.
   *
   * Optional for compatibility with older generated revision snapshots.
   */
  workStepId?: string | null;

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
