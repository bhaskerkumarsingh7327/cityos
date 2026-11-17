/**
 * Structured logger for CityOS:
 * - Development: Clean, human-readable terminal output with icons and colors.
 * - Production: JSON string for log aggregators (Datadog, CloudWatch, etc.).
 */

type LogMeta = Record<string, unknown>;

function getFormattedTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0]; // HH:MM:SS
}

function write(level: "info" | "warn" | "error" | "debug", message: string, meta?: LogMeta) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta } : {}),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
    return;
  }

  // Development: Clean, beautiful terminal output
  const time = getFormattedTime();

  let prefix = `[${time}]`;
  if (level === "info") prefix += " ℹ️ ";
  else if (level === "warn") prefix += " ⚠️ ";
  else if (level === "error") prefix += " ❌ ";
  else prefix += " 🔍 ";

  // eslint-disable-next-line no-console
  console.log(`${prefix} ${message}`);

  if (meta && Object.keys(meta).length > 0) {
    // eslint-disable-next-line no-console
    console.log(`       ↳ Details:`, meta);
  }
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
