import type { Role } from '../types';

// Mirrors the backend's require_role(...) gates exactly (see backend/app/routers/*.py).
// This is cosmetic/UX only — the FastAPI dependency is the real enforcement boundary.
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/home': ['Admin', 'Quality Engineer', 'Production Manager'],
  '/dashboard': ['Admin', 'Production Manager'],
  '/predict': ['Admin', 'Quality Engineer'],
  '/batches': ['Admin', 'Quality Engineer'],
  '/bulk': ['Admin', 'Production Manager'],
  '/reports': ['Admin', 'Quality Engineer', 'Production Manager'],
  '/admin': ['Admin'],
};

export function canAccess(path: string, role: Role | undefined): boolean {
  if (!role) return false;
  const allowed = ROUTE_ROLES[path];
  return allowed ? allowed.includes(role) : true;
}
