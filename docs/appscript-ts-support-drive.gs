// ==============================
// TS SUPPORT + GOOGLE DRIVE
// ==============================
const SHEET_NAME = "JadwalOperasi";
const DRIVE_FOLDER_ID = "1lxkK1VkOD5qevYDbU-aGCc23rjg4pNRz"; // Folder foto Xray
const TEAM_SHEET_NAME = "Team";
const TEAM_SHEET_NAME_LEGACY = "TeamTS";

const REQUIRED_HEADERS = [
  "Submission ID",
  "Timestamp",
  "Tanggal Operasi",
  "Hospital",
  "Operator",
  "Team TS",
  "Keterangan",
  "Pre Xray URL",
  "Pre Xray File ID",
  "Post Xray URL",
  "Post Xray File ID",
];

const TEAM_REQUIRED_HEADERS = [
  "No",
  "Nama",
  "Role",
  "Email",
  "Phone",
  "Profile Id",
  "Status",
  "Profile URL",
  "Updated At",
];

function doOptions() {
  return ContentService.createTextOutput("");
}

function doGet(e) {
  try {
    const action = String(e.parameter.action || "");
    const id = String(e.parameter.id || "");
    let result;

    if (action === "getTeamTs") {
      result = getAllTeamTs();
    } else if (action === "getEmails") {
      result = getUniqueTeamEmails();
    } else if (id) {
      result = getScheduleById(id);
    } else {
      result = getAllSchedules();
    }

    return createJsonResponse({ status: "success", data: result });
  } catch (error) {
    Logger.log(error);
    return createJsonResponse({ status: "error", message: error.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const action = String(payload.action || "");
    const data = payload.data || {};

    if (!action) throw new Error("Aksi (action) tidak ditemukan.");

    let result;
    if (action === "create") result = createSchedule(data);
    else if (action === "update") result = updateSchedule(data);
    else if (action === "delete") result = deleteSchedule(data);
    else if (action === "createTeamTs") result = createTeamTs(data);
    else if (action === "updateTeamTs") result = updateTeamTs(data);
    else if (action === "deleteTeamTs") result = deleteTeamTs(data);
    else if (action === "updateTeamTsStatus") result = updateTeamTsStatus(data);
    else throw new Error("Aksi tidak valid: " + action);

    return createJsonResponse({ status: "success", data: result });
  } catch (error) {
    Logger.log(error);
    return createJsonResponse({ status: "error", message: error.message });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ------------------------------
// CREATE
// ------------------------------
function createSchedule(data) {
  const tanggalOperasi = String(data.tanggalOperasi || "");
  const hospital = String(data.hospital || "");
  const operator = String(data.operator || "");
  const teamTs = Array.isArray(data.teamTs) ? data.teamTs : [];

  if (!tanggalOperasi || !hospital || !operator) {
    throw new Error("Data tidak lengkap: tanggal/hospital/operator wajib.");
  }

  const sheet = getOrCreateSheet_();
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);

  const submissionId = String(new Date().getTime());
  const teamNames = teamTs.map(function (member) { return String(member.name || "").trim(); }).filter(Boolean).join(", ");

  const preUploaded = uploadImageIfAny_(data.preXrayUpload, submissionId, "pre");
  const postUploaded = uploadImageIfAny_(data.postXrayUpload, submissionId, "post");

  const preXrayUrl = preUploaded.url || String(data.preXrayUrl || "");
  const postXrayUrl = postUploaded.url || String(data.postXrayUrl || "");
  const keterangan = normalizeKeterangan_(String(data.keterangan || ""), preXrayUrl, postXrayUrl);

  const rowObj = {};
  rowObj["Submission ID"] = submissionId;
  rowObj["Timestamp"] = new Date();
  rowObj["Tanggal Operasi"] = new Date(tanggalOperasi);
  rowObj["Hospital"] = hospital;
  rowObj["Operator"] = operator;
  rowObj["Team TS"] = teamNames;
  rowObj["Keterangan"] = keterangan;
  rowObj["Pre Xray URL"] = preXrayUrl;
  rowObj["Pre Xray File ID"] = preUploaded.fileId || "";
  rowObj["Post Xray URL"] = postXrayUrl;
  rowObj["Post Xray File ID"] = postUploaded.fileId || "";

  appendRowByHeaders_(sheet, headerMap, rowObj);
  sendNotificationIfAny_(data, tanggalOperasi, hospital, operator, teamNames, keterangan);

  return {
    message: "Jadwal berhasil dibuat.",
    submissionId: submissionId,
    preXrayUrl: preXrayUrl,
    postXrayUrl: postXrayUrl,
  };
}

// ------------------------------
// UPDATE
// ------------------------------
function updateSchedule(data) {
  const submissionId = String(data.submissionId || "");
  if (!submissionId) throw new Error("submissionId diperlukan untuk update.");

  const sheet = getOrCreateSheet_();
  const rowNumber = findRowBySubmissionId(submissionId);
  if (!rowNumber) throw new Error("Jadwal untuk update tidak ditemukan.");

  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);

  const oldPreId = String(
    data.oldPreXrayFileId ||
      rowObj["Pre Xray File ID"] ||
      extractDriveFileId_(String(data.oldPreXrayUrl || rowObj["Pre Xray URL"] || "")) ||
      ""
  );
  const oldPostId = String(
    data.oldPostXrayFileId ||
      rowObj["Post Xray File ID"] ||
      extractDriveFileId_(String(data.oldPostXrayUrl || rowObj["Post Xray URL"] || "")) ||
      ""
  );

  const preResult = resolveImageUpdate_({
    upload: data.preXrayUpload,
    deleteFlag: data.deletePreXray,
    keepUrl: data.preXrayUrl,
    keepFileId: data.preXrayFileId,
    oldFileId: oldPreId,
  }, submissionId, "pre");

  const postResult = resolveImageUpdate_({
    upload: data.postXrayUpload,
    deleteFlag: data.deletePostXray,
    keepUrl: data.postXrayUrl,
    keepFileId: data.postXrayFileId,
    oldFileId: oldPostId,
  }, submissionId, "post");

  const teamTs = Array.isArray(data.teamTs) ? data.teamTs : [];
  const teamNames = teamTs.map(function (member) { return String(member.name || "").trim(); }).filter(Boolean).join(", ");
  const hasTeamTsField = Object.prototype.hasOwnProperty.call(data, "teamTs");

  rowObj["Timestamp"] = new Date();
  if (data.tanggalOperasi) rowObj["Tanggal Operasi"] = new Date(data.tanggalOperasi);
  if (data.hospital !== undefined) rowObj["Hospital"] = String(data.hospital || "");
  if (data.operator !== undefined) rowObj["Operator"] = String(data.operator || "");
  if (hasTeamTsField) rowObj["Team TS"] = teamNames;
  rowObj["Pre Xray URL"] = preResult.url;
  rowObj["Pre Xray File ID"] = preResult.fileId;
  rowObj["Post Xray URL"] = postResult.url;
  rowObj["Post Xray File ID"] = postResult.fileId;
  rowObj["Keterangan"] = normalizeKeterangan_(String(data.keterangan || rowObj["Keterangan"] || ""), preResult.url, postResult.url);

  writeRowByHeaders_(sheet, rowNumber, headerMap, rowObj);

  return {
    submissionId: submissionId,
    message: "Data berhasil diperbarui.",
    preXrayUrl: preResult.url,
    postXrayUrl: postResult.url,
  };
}

// ------------------------------
// DELETE
// ------------------------------
function deleteSchedule(data) {
  const submissionId = String(data.submissionId || data.rowId || "");
  if (!submissionId) throw new Error("submissionId/rowId diperlukan untuk delete.");

  const sheet = getOrCreateSheet_();
  const rowNumber = findRowBySubmissionId(submissionId);
  if (!rowNumber) throw new Error("Jadwal untuk delete tidak ditemukan.");

  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);

  const preId = String(rowObj["Pre Xray File ID"] || extractDriveFileId_(String(rowObj["Pre Xray URL"] || "")) || "");
  const postId = String(rowObj["Post Xray File ID"] || extractDriveFileId_(String(rowObj["Post Xray URL"] || "")) || "");
  if (preId) deleteDriveFileSafe_(preId);
  if (postId) deleteDriveFileSafe_(postId);

  sheet.deleteRow(rowNumber);
  return { submissionId: submissionId, message: "Data + foto berhasil dihapus." };
}

// ------------------------------
// READ
// ------------------------------
function getAllSchedules() {
  const sheet = getOrCreateSheet_();
  if (sheet.getLastRow() < 2) return [];

  const headers = getHeaders_(sheet);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  return data
    .map(function (row) {
      const obj = {};
      headers.forEach(function (header, i) {
        obj[header] = row[i] instanceof Date ? row[i].toISOString() : row[i];
      });
      return obj;
    })
    .sort(function (a, b) {
      return new Date(String(b["Tanggal Operasi"] || "")).getTime() - new Date(String(a["Tanggal Operasi"] || "")).getTime();
    });
}

function getScheduleById(id) {
  const submissionId = String(id || "");
  const rowNumber = findRowBySubmissionId(submissionId);
  if (!rowNumber) throw new Error("Jadwal tidak ditemukan.");

  const sheet = getOrCreateSheet_();
  const headers = getHeaders_(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const obj = {};
  headers.forEach(function (header, i) { obj[header] = values[i]; });
  return obj;
}

function findRowBySubmissionId(id) {
  const submissionId = String(id || "");
  if (!submissionId) return null;
  const sheet = getOrCreateSheet_();
  if (sheet.getLastRow() < 2) return null;

  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const idCol = headerMap["Submission ID"];
  if (!idCol) throw new Error("Header 'Submission ID' tidak ditemukan.");

  const values = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().flat();
  const rowIndex = values.findIndex(function (value) { return String(value) === submissionId; });
  return rowIndex === -1 ? null : rowIndex + 2;
}

function getUniqueTeamEmails() {
  const members = getAllTeamTs();
  const seen = {};
  const emails = [];

  members.forEach(function (member) {
    const email = String(member["Email"] || "").trim().toLowerCase();
    const status = normalizeTeamStatus_(String(member["Status"] || "aktif"));
    const role = normalizeTeamRole_(String(member["Role"] || "ts"));
    if (!email || status !== "aktif" || role !== "ts" || seen[email]) return;
    seen[email] = true;
    emails.push(email);
  });

  return emails.sort();
}

// ------------------------------
// TEAM TS CRUD
// ------------------------------
function getAllTeamTs() {
  const sheet = getOrCreateTeamSheet_();
  if (sheet.getLastRow() < 2) return [];

  const headers = getHeaders_(sheet);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  return rows
    .map(function (row) {
      const obj = {};
      headers.forEach(function (header, index) {
        obj[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
      });
      return obj;
    })
    .sort(function (a, b) {
      const noA = Number(String(a["No"] || "").trim());
      const noB = Number(String(b["No"] || "").trim());
      if (Number.isFinite(noA) && Number.isFinite(noB)) return noA - noB;
      return String(a["Nama"] || "").localeCompare(String(b["Nama"] || ""));
    });
}

function createTeamTs(data) {
  const sheet = getOrCreateTeamSheet_();
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);

  const noInput = String(data.no || "").trim();
  const noValue = noInput || String(getNextTeamNo_(sheet, headerMap));
  const nama = String(data.nama || "").trim();
  const role = readTeamRoleInput_(data, "");
  const email = String(data.email || "").trim();
  const phone = String(data.phone || "").trim();
  const status = normalizeTeamStatus_(String(data.status || "aktif"));
  if (!nama) throw new Error("Nama Team TS wajib diisi.");

  if (findTeamRowByNo_(noValue)) {
    throw new Error("No Team TS sudah dipakai. Gunakan No lain.");
  }

  const uploaded = uploadImageIfAny_(data.profileUpload, "team_" + noValue, "profile");
  const profileId = uploaded.fileId || extractDriveFileId_(String(data.profileId || ""));
  const profileUrl = uploaded.url || buildDriveViewUrl_(profileId, String(data.profileUrl || ""));

  const rowObj = {};
  rowObj["No"] = noValue;
  rowObj["Nama"] = nama;
  rowObj["Role"] = role;
  rowObj["Email"] = email;
  rowObj["Phone"] = phone;
  rowObj["Profile Id"] = profileId;
  rowObj["Status"] = status;
  rowObj["Profile URL"] = profileUrl;
  rowObj["Updated At"] = new Date();

  appendRowByHeaders_(sheet, headerMap, rowObj);

  return {
    message: "Team TS berhasil ditambahkan.",
    no: noValue,
    profileId: profileId,
    profileUrl: profileUrl,
  };
}

function updateTeamTs(data) {
  const oldNo = String(data.oldNo || data.no || "").trim();
  if (!oldNo) throw new Error("No Team TS diperlukan untuk update.");

  const rowNumber = findTeamRowByNo_(oldNo);
  if (!rowNumber) throw new Error("Data Team TS tidak ditemukan.");

  const sheet = getOrCreateTeamSheet_();
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);

  const nextNo = String(data.no || oldNo).trim() || oldNo;
  if (nextNo !== oldNo) {
    const existingWithNextNo = findTeamRowByNo_(nextNo);
    if (existingWithNextNo) throw new Error("No Team TS tujuan sudah dipakai.");
  }

  const oldProfileId = String(
    rowObj["Profile Id"] ||
      data.oldProfileId ||
      extractDriveFileId_(String(rowObj["Profile URL"] || "")) ||
      ""
  );

  let profileId = String(data.profileId || oldProfileId || "");
  let profileUrl = String(data.profileUrl || rowObj["Profile URL"] || "");

  if (data.profileUpload && data.profileUpload.dataUrl) {
    if (oldProfileId) deleteDriveFileSafe_(oldProfileId);
    const uploaded = uploadImageIfAny_(data.profileUpload, "team_" + nextNo, "profile");
    profileId = uploaded.fileId || "";
    profileUrl = uploaded.url || "";
  } else if (Boolean(data.deleteProfile)) {
    if (oldProfileId) deleteDriveFileSafe_(oldProfileId);
    profileId = "";
    profileUrl = "";
  } else {
    profileId = profileId || extractDriveFileId_(profileUrl);
    profileUrl = buildDriveViewUrl_(profileId, profileUrl);
  }

  rowObj["No"] = nextNo;
  if (data.nama !== undefined) rowObj["Nama"] = String(data.nama || "");
  rowObj["Role"] = readTeamRoleInput_(data, String(rowObj["Role"] || ""));
  if (data.email !== undefined) rowObj["Email"] = String(data.email || "");
  if (data.phone !== undefined) rowObj["Phone"] = String(data.phone || "");
  rowObj["Profile Id"] = profileId;
  rowObj["Profile URL"] = profileUrl;
  rowObj["Status"] = normalizeTeamStatus_(String(data.status || rowObj["Status"] || "aktif"));
  rowObj["Updated At"] = new Date();

  writeRowByHeaders_(sheet, rowNumber, headerMap, rowObj);

  return {
    message: "Team TS berhasil diperbarui.",
    no: nextNo,
    profileId: profileId,
    profileUrl: profileUrl,
  };
}

function updateTeamTsStatus(data) {
  const noValue = String(data.no || "").trim();
  if (!noValue) throw new Error("No Team TS diperlukan untuk update status.");

  const rowNumber = findTeamRowByNo_(noValue);
  if (!rowNumber) throw new Error("Data Team TS tidak ditemukan.");

  const sheet = getOrCreateTeamSheet_();
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const status = normalizeTeamStatus_(String(data.status || "aktif"));

  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);
  rowObj["Status"] = status;
  rowObj["Updated At"] = new Date();
  writeRowByHeaders_(sheet, rowNumber, headerMap, rowObj);

  return { message: "Status Team TS berhasil diperbarui.", no: noValue, status: status };
}

function deleteTeamTs(data) {
  const noValue = String(data.no || data.id || "").trim();
  if (!noValue) throw new Error("No Team TS diperlukan untuk delete.");

  const rowNumber = findTeamRowByNo_(noValue);
  if (!rowNumber) throw new Error("Data Team TS tidak ditemukan.");

  const sheet = getOrCreateTeamSheet_();
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);
  const profileId = String(rowObj["Profile Id"] || extractDriveFileId_(String(rowObj["Profile URL"] || "")) || "");
  if (profileId) deleteDriveFileSafe_(profileId);

  sheet.deleteRow(rowNumber);
  return { message: "Team TS berhasil dihapus.", no: noValue };
}

function findTeamRowByNo_(noValue) {
  const key = String(noValue || "").trim();
  if (!key) return null;

  const sheet = getOrCreateTeamSheet_();
  if (sheet.getLastRow() < 2) return null;
  const headers = getHeaders_(sheet);
  const headerMap = toHeaderMap_(headers);
  const noCol = headerMap["No"];
  if (!noCol) throw new Error("Header 'No' pada Team TS tidak ditemukan.");

  const values = sheet.getRange(2, noCol, sheet.getLastRow() - 1, 1).getValues().flat();
  const index = values.findIndex(function (value) {
    return String(value || "").trim() === key;
  });
  return index === -1 ? null : index + 2;
}

// ------------------------------
// DRIVE HELPERS
// ------------------------------
function uploadImageIfAny_(upload, submissionId, label) {
  if (!upload || typeof upload !== "object" || !upload.dataUrl) return { url: "", fileId: "" };

  const payload = parseDataUrl_(String(upload.dataUrl || ""));
  if (!payload.base64 || !payload.mimeType) throw new Error("Format dataUrl foto tidak valid.");

  const bytes = Utilities.base64Decode(payload.base64);
  const ext = (payload.mimeType.split("/")[1] || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const baseName = String(upload.fileName || `${label}-${submissionId}.${ext}`).replace(/[^\w.\-]/g, "_");
  const fileName = `${submissionId}_${label}_${Date.now()}_${baseName}`;
  const blob = Utilities.newBlob(bytes, payload.mimeType, fileName);

  const folder = getDriveFolder_();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
  };
}

function resolveImageUpdate_(opts, submissionId, label) {
  const upload = opts.upload;
  const deleteFlag = Boolean(opts.deleteFlag);
  const keepUrl = String(opts.keepUrl || "");
  const keepFileId = String(opts.keepFileId || "");
  const oldFileId = String(opts.oldFileId || "");

  if (upload && upload.dataUrl) {
    if (oldFileId) deleteDriveFileSafe_(oldFileId);
    return uploadImageIfAny_(upload, submissionId, label);
  }

  if (deleteFlag) {
    if (oldFileId) deleteDriveFileSafe_(oldFileId);
    return { url: "", fileId: "" };
  }

  const fileId = keepFileId || oldFileId || extractDriveFileId_(keepUrl);
  const url = keepUrl || (fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : "");
  return { url: url, fileId: fileId };
}

function deleteDriveFileSafe_(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (error) {
    Logger.log("Gagal hapus file Drive: " + fileId + " -> " + error);
  }
}

function parseDataUrl_(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+?);base64,([\s\S]+)$/);
  if (!match) return { mimeType: "", base64: "" };
  return { mimeType: match[1], base64: match[2] };
}

function extractDriveFileId_(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[a-zA-Z0-9_-]{20,}$/.test(source)) return source;
  const fromPath = source.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (fromPath && fromPath[1]) return fromPath[1];
  const fromDirectPath = source.match(/\/d\/([a-zA-Z0-9_-]{20,})(?:[/?=&]|$)/);
  if (fromDirectPath && fromDirectPath[1]) return fromDirectPath[1];
  const fromParam = source.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (fromParam && fromParam[1]) return fromParam[1];
  return "";
}

function getDriveFolder_() {
  const folderId = String(DRIVE_FOLDER_ID || "").trim();
  if (!folderId) return DriveApp.getRootFolder();
  return DriveApp.getFolderById(folderId);
}

function buildDriveViewUrl_(fileId, fallbackUrl) {
  const normalizedId = extractDriveFileId_(String(fileId || ""));
  if (normalizedId) return `https://drive.google.com/uc?export=view&id=${normalizedId}`;
  return String(fallbackUrl || "").trim();
}

// ------------------------------
// SHEET HELPERS
// ------------------------------
function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function getOrCreateTeamSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TEAM_SHEET_NAME);
  if (!sheet) sheet = ss.getSheetByName(TEAM_SHEET_NAME_LEGACY);
  if (!sheet) sheet = ss.insertSheet(TEAM_SHEET_NAME);
  ensureTeamHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) { return String(h || "").trim(); });
  let nextCol = current.length + 1;
  REQUIRED_HEADERS.forEach(function (header) {
    if (current.indexOf(header) === -1) {
      sheet.getRange(1, nextCol).setValue(header);
      current.push(header);
      nextCol += 1;
    }
  });
}

function ensureTeamHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, TEAM_REQUIRED_HEADERS.length).setValues([TEAM_REQUIRED_HEADERS]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) { return String(h || "").trim(); });
  let nextCol = current.length + 1;
  TEAM_REQUIRED_HEADERS.forEach(function (header) {
    if (current.indexOf(header) === -1) {
      sheet.getRange(1, nextCol).setValue(header);
      current.push(header);
      nextCol += 1;
    }
  });
}

function getNextTeamNo_(sheet, headerMap) {
  const noCol = headerMap["No"];
  if (!noCol) return 1;
  if (sheet.getLastRow() < 2) return 1;

  const values = sheet.getRange(2, noCol, sheet.getLastRow() - 1, 1).getValues().flat();
  const numbers = values
    .map(function (value) { return Number(String(value || "").trim()); })
    .filter(function (value) { return Number.isFinite(value); });
  if (!numbers.length) return 1;
  return Math.max.apply(null, numbers) + 1;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) { return String(h || "").trim(); });
}

function toHeaderMap_(headers) {
  const map = {};
  headers.forEach(function (header, index) {
    if (header) map[header] = index + 1;
  });
  return map;
}

function appendRowByHeaders_(sheet, headerMap, rowObj) {
  const maxCol = sheet.getLastColumn();
  const row = new Array(maxCol).fill("");
  Object.keys(rowObj).forEach(function (header) {
    const col = headerMap[header];
    if (!col) return;
    row[col - 1] = rowObj[header];
  });
  sheet.appendRow(row);
}

function readRowByHeaders_(sheet, rowNumber, headerMap) {
  const maxCol = sheet.getLastColumn();
  const values = sheet.getRange(rowNumber, 1, 1, maxCol).getValues()[0];
  const obj = {};
  Object.keys(headerMap).forEach(function (header) {
    obj[header] = values[headerMap[header] - 1];
  });
  return obj;
}

function writeRowByHeaders_(sheet, rowNumber, headerMap, rowObj) {
  const maxCol = sheet.getLastColumn();
  const values = sheet.getRange(rowNumber, 1, 1, maxCol).getValues()[0];
  Object.keys(rowObj).forEach(function (header) {
    const col = headerMap[header];
    if (!col) return;
    values[col - 1] = rowObj[header];
  });
  sheet.getRange(rowNumber, 1, 1, maxCol).setValues([values]);
}

function normalizeKeterangan_(text, preUrl, postUrl) {
  const stripped = String(text || "")
    .replace(/\s*\|\s*Pre Xray:[^|]*/gi, "")
    .replace(/\s*\|\s*Post Xray:[^|]*/gi, "")
    .trim();

  const parts = stripped ? [stripped] : [];
  if (preUrl) parts.push("Pre Xray: " + preUrl);
  if (postUrl) parts.push("Post Xray: " + postUrl);
  return parts.join(" | ");
}

function sendNotificationIfAny_(data, tanggalOperasi, hospital, operator, teamNames, keterangan) {
  const recipients = Array.isArray(data.recipients) ? data.recipients : [];
  if (!recipients.length) return;

  const subject = `Jadwal Operasi Baru: ${hospital} - ${new Date(tanggalOperasi).toLocaleDateString("id-ID")}`;
  const htmlBody = `
    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:14px;line-height:1.6">
      <h2 style="margin:0 0 8px">Notifikasi Jadwal Operasi</h2>
      <p><b>Tanggal:</b> ${new Date(tanggalOperasi).toLocaleDateString("id-ID")}</p>
      <p><b>Rumah Sakit:</b> ${hospital}</p>
      <p><b>Operator:</b> ${operator}</p>
      <p><b>Tim TS:</b> ${teamNames}</p>
      <p><b>Keterangan:</b> ${keterangan || "-"}</p>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: subject,
    htmlBody: htmlBody,
    name: "Jadwal Operasi",
  });
}

function normalizeTeamStatus_(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "sakit") return "sakit";
  if (value === "izin") return "izin";
  if (value === "cuti") return "cuti";
  if (value === "non_aktif" || value === "non aktif" || value === "nonaktif" || value === "inactive") {
    return "non_aktif";
  }
  return "aktif";
}

function normalizeTeamRole_(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value || value === "-" || value === "none" || value === "null") return "";
  if (value === "sales" || value === "direktor" || value === "director" || value === "direktur") return "";
  if (value === "ts" || value === "teknikal support" || value === "technical support" || value === "ts support") {
    return "ts";
  }
  if (value === "logistik" || value === "logistic") return "logistik";
  if (value === "admin" || value === "administrator") return "admin";
  return "";
}

function readTeamRoleInput_(data, fallback) {
  const hasRoleKey =
    Object.prototype.hasOwnProperty.call(data, "role") ||
    Object.prototype.hasOwnProperty.call(data, "Role") ||
    Object.prototype.hasOwnProperty.call(data, "jabatan") ||
    Object.prototype.hasOwnProperty.call(data, "Jabatan");

  if (!hasRoleKey) return normalizeTeamRole_(String(fallback || ""));

  const rawRole = Object.prototype.hasOwnProperty.call(data, "role")
    ? data.role
    : Object.prototype.hasOwnProperty.call(data, "Role")
      ? data.Role
      : Object.prototype.hasOwnProperty.call(data, "jabatan")
        ? data.jabatan
        : data.Jabatan;

  return normalizeTeamRole_(String(rawRole || ""));
}
