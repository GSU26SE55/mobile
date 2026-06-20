/**
 * Parse a multi-step instruction string into an array of step strings.
 * Handles formats like:
 *   "1. Step one\n2. Step two"
 *   "- Step one\n- Step two"
 *   "Step one\nStep two"
 * Returns at least 1 item; trims each step and removes empty lines.
 */
export function parseSteps(text: string): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  return lines.map((line) =>
    line.replace(/^(\d+[.)]\s*|[-*•]\s*)/, '').trim(),
  );
}
