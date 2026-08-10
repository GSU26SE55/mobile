import type { StaffAddCommentPayload } from '@/src/features/staff/types/staff.types';

// ── Chat outbox (offline-first comment sending) ──────────────────────────
// Messages queued for the BE, persisted in AsyncStorage per ticket. A worker
// sends them FIFO with backoff retry; past the deadline → status "failed"
// (waiting for the user to retry). Mirrors the Web outbox
// (frontend/src/shared/types/chat/chat.types.ts) — mobile persists to
// AsyncStorage instead of localStorage.
export type OutboxStatus = 'queued' | 'sending' | 'failed';

// StaffAddCommentPayload is the superset (isInternal?: boolean) — Customer's
// AddCommentPayload (isInternal: false) is assignable to it, so one outbox
// type serves both callers.
export interface OutboxMessage {
  /** Temporary FE-side id — "temp-{ticketId}-{seq}", seq from a persisted counter in the store. */
  tempId: string;
  ticketId: string;
  payload: StaffAddCommentPayload;
  status: OutboxStatus;
  /** Number of send attempts so far (used to compute the backoff delay). */
  attempt: number;
  createdAt: number;
  /** createdAt + total timeout — still unsent past this point → "failed". */
  deadline: number;
  /** Failure reason shown to the user (e.g. duplicate content) — set only when retrying is pointless. */
  failReason?: string;
}
