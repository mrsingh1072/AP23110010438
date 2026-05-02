export type LogStack = 'frontend';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogPackage = 'api' | 'component' | 'hook' | 'page' | 'state' | 'style';

interface LogPayload {
  stack: LogStack;
  level: LogLevel;
  package: LogPackage;
  message: string;
}

const LOG_ENDPOINT = '/evaluation-service/logs';
const VALID_STACKS: LogStack[] = ['frontend'];
const VALID_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const VALID_PACKAGES: LogPackage[] = ['api', 'component', 'hook', 'page', 'state', 'style'];

function isValidValue<T extends string>(value: string, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Get access token from global window object (set by auth context)
 */
function getLoggerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__CAMPUS_ACCESS_TOKEN__ ?? null;
}

/**
 * Log to evaluation service
 * stack: "frontend"
 * level: "debug" | "info" | "warn" | "error" | "fatal"
 * packageName: "api" | "component" | "hook" | "page" | "state" | "style"
 * message: descriptive log message
 */
export async function Log(stack: string, level: string, packageName: string, message: string): Promise<void> {
  // Validate inputs
  if (!isValidValue(stack, VALID_STACKS) || !isValidValue(level, VALID_LEVELS) || !isValidValue(packageName, VALID_PACKAGES)) {
    return;
  }

  const accessToken = getLoggerToken();
  if (!accessToken) {
    // Token not yet available; silently skip
    return;
  }

  const payload: LogPayload = {
    stack,
    level,
    package: packageName,
    message,
  };

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail on logging errors; never crash the app
    return;
  }
}
