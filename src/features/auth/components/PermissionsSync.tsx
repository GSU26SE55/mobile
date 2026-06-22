import { useMyPermissions } from '../hooks/useMyPermissions';

/**
 * GH-47 — mount 1 lần trong cây (root _layout) để sync permission tươi vào sessionStore
 * cho mọi authed user. Không render UI.
 */
export function PermissionsSync() {
  useMyPermissions();
  return null;
}
