/**
 * Frontend mirror of the backend's role-edit authorization matrix.
 *
 * The backend at `src/users/role-policy.ts` is the source of truth — the UI
 * uses this to filter what to show, but the API is the ultimate authority.
 * If these ever drift, the backend's response will surface as a 4xx toast.
 */

export type AnyRole = "DEV" | "ADMIN" | "USUARIO";
export type EditableRole = Exclude<AnyRole, "DEV">;

const ADMIN_OR_DEV = new Set<AnyRole>(["DEV", "ADMIN"]);

const ALLOWED_PAIRS = new Set<string>([
  "USUARIO->ADMIN",
  "ADMIN->USUARIO",
]);

export function canChangeRole(
  actorRole: AnyRole,
  targetCurrentRole: AnyRole,
  newRole: AnyRole,
): boolean {
  if (!ADMIN_OR_DEV.has(actorRole)) return false;
  return ALLOWED_PAIRS.has(`${targetCurrentRole}->${newRole}`);
}

/**
 * Returns the list of `newRole` options the actor may set for a target
 * with `targetCurrentRole`. Used to populate the role-edit <select>.
 *
 * NOTE: DEV is excluded from the candidate list — the API rejects DEV
 * via the DTO validator anyway, and the matrix forbids it.
 */
export function allowedRoleTransitions(
  actorRole: AnyRole,
  targetCurrentRole: AnyRole,
): EditableRole[] {
  const candidates: EditableRole[] = ["USUARIO", "ADMIN"];
  return candidates.filter((c) =>
    canChangeRole(actorRole, targetCurrentRole, c),
  );
}

/**
 * Whether the actor should be shown any role-edit controls at all
 * for the given target. ADMIN cannot edit DEV; common actors cannot
 * edit anyone.
 */
export function canEditRoleOf(
  actorRole: AnyRole,
  targetRole: AnyRole,
): boolean {
  if (!ADMIN_OR_DEV.has(actorRole)) return false;
  if (targetRole === "DEV") return false;
  return allowedRoleTransitions(actorRole, targetRole).length > 0;
}
