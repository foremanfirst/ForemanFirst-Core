/**
 * Eva Core
 *
 * Shared types for Qoreva's administrative safety intelligence layer.
 *
 * Eva is an assistant layer across Qoreva.
 * Domain-specific capabilities are implemented as Skills and Tools.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

export type EvaUserRole =
  | "TENANT_ADMIN"
  | "SAFETY_MANAGER"
  | "PROJECT_MANAGER"
  | "SUPERINTENDENT"
  | "FOREMAN"
  | "QUALIFIED_PERSON"
  | "OTHER";

export type EvaPermission =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "SUBMIT"
  | "APPROVE"
  | "ADMIN";

export type EvaActionRisk =
  | "READ_ONLY"
  | "DRAFT"
  | "USER_CONFIRMATION"
  | "QUALIFIED_REVIEW"
  | "ADMINISTRATIVE";

export type EvaSkillStatus =
  | "AVAILABLE"
  | "COMING_SOON"
  | "DISABLED";

export type EvaUserContext = {
  userId: string;
  email: string | null;
  displayName: string | null;

  tenantId: string;

  tenantRoles: EvaUserRole[];

  projectId: string | null;
  projectRoles: EvaUserRole[];

  permissions: EvaPermission[];
};

export type EvaProjectContext = {
  projectId: string;
  tenantId: string;

  name: string;
  projectCode: string | null;
  clientName: string | null;
  location: string | null;
};

export type EvaConversationContext = {
  user: EvaUserContext;
  project: EvaProjectContext | null;

  currentModule: string | null;
  currentRecordId: string | null;

  userMessage: string;
};

export type EvaSkillDefinition = {
  id: string;
  name: string;
  description: string;

  status: EvaSkillStatus;

  requiredPermissions: EvaPermission[];

  actionRisk: EvaActionRisk;
};

export type EvaToolDefinition = {
  id: string;
  name: string;
  description: string;

  skillId: string;

  requiredPermissions: EvaPermission[];

  actionRisk: EvaActionRisk;

  requiresUserConfirmation: boolean;
};

export type EvaResponse = {
  message: string;

  suggestions?: string[];

  requiresConfirmation?: boolean;

  sourceSkill?: string;

  sourceTool?: string;

  /**
   * Tool result returned to the authorized caller.
   *
   * Eva does not automatically persist or finalize this data.
   * The caller remains responsible for human review and any
   * subsequent domain action.
   */
  data?: unknown;
};
