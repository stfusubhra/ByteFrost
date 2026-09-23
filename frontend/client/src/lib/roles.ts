/* KisanSetu role helpers — single source of truth for role → workspace routing.
 *
 * Kept in one place so PublicLayout, ProtectedRoute, Login and any future
 * guard agree on where each role lands after sign-in.
 */

export const BUYER_ROLES = ["buyer_bulk", "buyer_retailer", "consumer"];
export const FARMER_ROLES = ["farmer", "fpo_manager"];

/** Workspace route for a given role. Buyers land on the buyer dashboard,
 *  everyone else (farmers, FPO managers, logistics, admin) on the farm dashboard. */
export function workspaceForRole(role: string | null | undefined): string {
  if (role && BUYER_ROLES.includes(role)) return "/buyer-dashboard";
  return "/dashboard";
}

export function isBuyerRole(role: string | null | undefined): boolean {
  return !!role && BUYER_ROLES.includes(role);
}

export function isFarmerRole(role: string | null | undefined): boolean {
  return !!role && FARMER_ROLES.includes(role);
}