import { useMyPermissions } from '../hooks/useMyPermissions';

/**
 * GH-47 — mounted once in the tree (root _layout) to sync fresh permissions into sessionStore
 * for every authenticated user. Renders no UI.
 */
export function PermissionsSync() {
  useMyPermissions();
  return null;
}
