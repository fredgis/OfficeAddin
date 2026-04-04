function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
}

function parseJwtSection(token: string, sectionIndex: number): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const decoded = decodeBase64Url(parts[sectionIndex]);
    const parsed = JSON.parse(decoded) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function parseJwtHeader(token: string): Record<string, unknown> | null {
  return parseJwtSection(token, 0);
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  return parseJwtSection(token, 1);
}

export function hasJwtShape(token: string | null | undefined): token is string {
  return (
    typeof token === 'string' &&
    token.split('.').length === 3 &&
    parseJwtHeader(token) !== null &&
    parseJwtPayload(token) !== null
  );
}
