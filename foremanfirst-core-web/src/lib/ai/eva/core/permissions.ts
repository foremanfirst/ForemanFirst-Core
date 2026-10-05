/**
 * Eva Permission Boundary
 *
 * Eva must never bypass Qoreva authorization.
 *
 * This module provides the central policy boundary that future
 * Eva tools will use before reading or modifying Qoreva data.
 */

import type {
  EvaPermission,
  EvaUserContext,
} from "./types";

export function hasEvaPermission(
  user: EvaUserContext,
  permission: EvaPermission,
): boolean {
  return user.permissions.includes(permission);
}

export function requireEvaPermission(
  user: EvaUserContext,
  permission: EvaPermission,
): void {
  if (!hasEvaPermission(user, permission)) {
    throw new Error(
      `Eva permission denied: ${permission}`,
    );
  }
}
