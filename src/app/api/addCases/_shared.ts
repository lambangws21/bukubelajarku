type UnknownRecord = Record<string, unknown>;

const APPSCRIPT_ENDPOINT_RAW =
  process.env.GAS_CASES_URL ||
  process.env.APPSCRIPT_CASES_ENDPOINT ||
  process.env.NEXT_PUBLIC_APPSCRIPT_ENDPOINT ||
  "";

export const getAppsScriptEndpoint = () => {
  const endpoint = String(APPSCRIPT_ENDPOINT_RAW || "").trim();
  if (!endpoint) {
    throw new Error(
      "Missing GAS_CASES_URL/APPSCRIPT_CASES_ENDPOINT. Set .env.local to your latest Apps Script Web App URL."
    );
  }
  return endpoint;
};

const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,}$/;

const pick = (row: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const toStringSafe = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => toStringSafe(item))
          .filter(Boolean)
          .map((item) => item.toLowerCase())
      )
    );
  }

  const raw = toStringSafe(value);
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase())
    )
  );
};

const normalizeDriveIds = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((part) => toStringSafe(part))
      .filter(Boolean)
      .filter((part) => DRIVE_ID_REGEX.test(part))
      .join(",");
  }

  const raw = toStringSafe(value);
  if (!raw) return "";

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => DRIVE_ID_REGEX.test(part))
    .join(",");
};

const toDriveImageUrl = (ids: string) => {
  const firstId = ids.split(",").map((v) => v.trim()).find(Boolean);
  if (!firstId) return null;
  return `https://drive.google.com/uc?export=view&id=${firstId}`;
};

const normalizeRow = (row: UnknownRecord) => {
  const rowNo = toStringSafe(pick(row, ["no", "No", "NO", "id", "ID"]));
  const title = toStringSafe(
    pick(row, ["title", "Title", "tindakan", "Tindakan", "namaKasus"])
  );
  const note = toStringSafe(pick(row, ["note", "Note", "keterangan", "Keterangan"]));
  const driveIds = normalizeDriveIds(
    pick(row, [
      "googleDriveId",
      "GoogleDriveID",
      "googleDriveID",
      "googleDriveIds",
      "GoogleDriveIds",
      "google_drive_id",
    ])
  );
  const imageUrlRaw = toStringSafe(pick(row, ["imageUrl", "ImageUrl", "fileUrl", "FileUrl"]));
  const createdAt = toStringSafe(pick(row, ["createdAt", "CreatedAt", "date", "Date", "tanggal", "Tanggal"]));
  const tags = normalizeTags(pick(row, ["tags", "Tags", "tag", "Tag"]));

  return {
    ...row,
    no: rowNo || undefined,
    id: rowNo || undefined,
    title,
    tindakan: title,
    note,
    googleDriveId: driveIds || undefined,
    imageUrl: imageUrlRaw || toDriveImageUrl(driveIds),
    createdAt: createdAt || undefined,
    tags,
  };
};

const extractRows = (payload: unknown): UnknownRecord[] => {
  if (Array.isArray(payload)) return payload.filter((v): v is UnknownRecord => !!v && typeof v === "object");
  if (!payload || typeof payload !== "object") return [];

  const obj = payload as UnknownRecord;
  const candidates = [
    obj.data,
    obj.records,
    obj.rows,
    (obj.result as UnknownRecord | undefined)?.data,
    (obj.result as UnknownRecord | undefined)?.rows,
  ];

  const hit = candidates.find((item) => Array.isArray(item));
  if (!Array.isArray(hit)) return [];

  return hit.filter((v): v is UnknownRecord => !!v && typeof v === "object");
};

export const normalizeCasesPayload = (payload: unknown) => {
  if (payload && typeof payload === "object") {
    const obj = payload as UnknownRecord;
    const statusRaw = toStringSafe(obj.status).toLowerCase();
    if (statusRaw === "error") {
      return {
        status: "error",
        message: toStringSafe(obj.message) || "Apps Script returned error",
        scriptVersion: toStringSafe(obj.scriptVersion) || undefined,
        data: [],
      };
    }
  }

  const rows = extractRows(payload);
  const normalized = rows.map(normalizeRow);

  const scriptVersion =
    payload && typeof payload === "object"
      ? toStringSafe((payload as UnknownRecord).scriptVersion) || undefined
      : undefined;

  const message =
    payload && typeof payload === "object"
      ? toStringSafe((payload as UnknownRecord).message) || undefined
      : undefined;

  return {
    status: "success",
    scriptVersion,
    ...(message ? { message } : {}),
    data: normalized,
  };
};

export const buildMutationPayload = (body: UnknownRecord, methodOverride: "PUT" | "DELETE") => {
  const noRaw = body.no ?? body.id ?? body.No ?? body.ID;
  const no = toStringSafe(noRaw);
  const title = toStringSafe(body.title ?? body.tindakan) || "-";
  const note = toStringSafe(body.note) || "-";
  const base64Images = Array.isArray(body.base64Images) ? body.base64Images : [];
  const fileNames = Array.isArray(body.fileNames) ? body.fileNames : [];
  const sheet = toStringSafe(body.sheet) || "Sheet1";
  const tags = normalizeTags(body.tags ?? body.tag ?? body.tagsCsv);
  const tagsCsv = tags.join(",");

  return {
    ...body,
    ...(no ? { no, No: no, id: no } : {}),
    // Compatibility flags for different Apps Script styles.
    _method: methodOverride,
    method: methodOverride,
    methodOverride,
    sheet,
    // Compatibility fields for Apps Script that still validates create fields before methodOverride.
    title,
    note,
    tags,
    tagsCsv,
    base64Images,
    fileNames,
  };
};
