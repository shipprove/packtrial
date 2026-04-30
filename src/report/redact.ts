const SECRET_PATTERNS: RegExp[] = [
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /npm_[A-Za-z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  /\b[A-Za-z0-9+/]{32,}={0,2}\b/g
];

export function redact(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }

  let redacted = value;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }

  for (const key of ["GITHUB_TOKEN", "NODE_AUTH_TOKEN", "NPM_TOKEN"]) {
    const secret = process.env[key];
    if (secret) {
      redacted = redacted.split(secret).join("[REDACTED]");
    }
  }

  return redacted;
}

