import { Alert } from 'react-native';
import { ErrorEntity } from '@/src/types/api.types';

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export class EntityError extends HttpError {
  readonly errors: ErrorEntity[];

  constructor(errors: ErrorEntity[], statusCode: number = 422) {
    super(statusCode, 'Validation error');
    this.name = 'EntityError';
    this.errors = errors;
  }
}

/**
 * Business error codes the BE returns in `message` (no separate errorCode field).
 * Showing the raw code on an Alert would read as "CHAT_DUPLICATE_MESSAGE_LIMIT" to the user.
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  CHAT_DUPLICATE_MESSAGE_LIMIT:
    'You\'ve sent this message too many times. Please change the content.',
  CHAT_SPAM_CHECK_IN_PROGRESS:
    'The system is still checking the previous message. Please try again shortly.',
};

/** Maps a BE error code to a readable message; passes the message through unchanged if it's not a known code. */
export function toUserMessage(message: string): string {
  return ERROR_CODE_MESSAGES[message] ?? message;
}

type SetFieldError = (field: string, message: string) => void;

interface HandleErrorApiOptions {
  error: unknown;
  setFieldError?: SetFieldError;
}

/**
 * Handles API errors for forms — same pattern as Web but uses Alert instead of toast.
 *
 * - EntityError (BE validation):  maps errors down to each field via setFieldError
 * - HttpError (general error):    shows an Alert
 * - other Error:                  shows a generic Alert
 */
export function handleErrorApi({ error, setFieldError }: HandleErrorApiOptions) {
  if (error instanceof EntityError) {
    if (setFieldError) {
      error.errors.forEach(({ field, detail }) => {
        // field from BE is PascalCase (e.g. "FullName") — normalize to camelCase
        const key = field.charAt(0).toLowerCase() + field.slice(1);
        setFieldError(key, detail);
      });
    }
    return;
  }

  if (error instanceof HttpError) {
    Alert.alert('Error', toUserMessage(error.message));
    return;
  }

  if (error instanceof Error && error.message !== 'CANCELLED') {
    Alert.alert('Error', error.message);
  }
}

