const DRIVE_ID_ONLY_REGEX = /^[a-zA-Z0-9_-]{20,}$/;

function tryDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractGoogleDriveId(input?: string | null): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  if (DRIVE_ID_ONLY_REGEX.test(raw)) return raw;

  const decoded = tryDecode(raw);
  const directMatch = decoded.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (directMatch?.[1]) return directMatch[1];

  const ucMatch = decoded.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch?.[1]) return ucMatch[1];

  try {
    const url = new URL(decoded);
    const byQuery = url.searchParams.get("id");
    if (byQuery && DRIVE_ID_ONLY_REGEX.test(byQuery)) return byQuery;

    const byPath = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (byPath?.[1]) return byPath[1];
  } catch {
    return null;
  }

  return null;
}

export function isGoogleDriveUrl(input?: string | null): boolean {
  if (!input) return false;
  const raw = String(input).trim();
  if (!raw) return false;

  if (extractGoogleDriveId(raw)) return true;
  return (
    raw.includes("drive.google.com") ||
    raw.includes("docs.google.com") ||
    raw.includes("googleusercontent.com")
  );
}

export function normalizeImageUrl(input?: string | null): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("/")) return raw;

  const driveId = extractGoogleDriveId(raw);
  if (driveId) return `https://drive.google.com/uc?export=view&id=${driveId}`;

  return raw;
}

export function toSafeImageSrc(input?: string | null, fallback = "/no-image.png"): string {
  const normalized = normalizeImageUrl(input);
  if (!normalized) return fallback;

  if (
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("/")
  ) {
    return normalized;
  }

  if (isGoogleDriveUrl(input) || isGoogleDriveUrl(normalized)) {
    return `/api/proxy-image?url=${encodeURIComponent(normalized)}`;
  }

  return normalized;
}

export function buildGoogleDriveImageCandidates(input?: string | null): string[] {
  const normalized = normalizeImageUrl(input);
  const id = extractGoogleDriveId(normalized);
  if (!id) return normalized ? [normalized] : [];

  return [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
  ];
}
