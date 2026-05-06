// Production-safe logger. Detail only in dev builds.
const IS_DEV = import.meta.env.DEV;

export function logError(label: string, error?: unknown): void {
  if (IS_DEV) {
    if (error !== undefined) console.error(label, error);
    else console.error(label);
  } else {
    console.error(label);
  }
}
