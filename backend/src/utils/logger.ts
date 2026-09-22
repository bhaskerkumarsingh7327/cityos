/**
 * Minimal structured logger for Phase 1.
 * Replace with a full library (pino/winston) if/when volume justifies it —
 * keep the same call signature so callers don't need to change.
 */

type LogMeta = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string, meta?: LogMeta) {
  const entry = {
    timestamp: timestamp(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV !== "production") {
      write("debug", message, meta);
    }
  },
};