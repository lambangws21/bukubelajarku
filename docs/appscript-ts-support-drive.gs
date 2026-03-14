// ==============================
// TS SUPPORT + GOOGLE DRIVE
// ==============================
const SHEET_NAME = "JadwalOperasi";
const DRIVE_FOLDER_ID = "1lxkK1VkOD5qevYDbU-aGCc23rjg4pNRz"; // Folder foto Xray
const TEAM_SHEET_NAME = "Team";
const TEAM_SHEET_NAME_LEGACY = "TeamTS";
const ACTIVITY_SHEET_NAME = "ActivityLog";

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

const ACTIVITY_REQUIRED_HEADERS = [
  "Log ID",
  "Timestamp",
  "Timestamp Ms",
  "Action",
  "Entity Type",
  "Entity ID",
  "Date Key",
  "Actor Name",
  "Actor Email",
  "Actor Username",
  "Actor Role",
  "Doctor",
  "Hospital",
  "Before Status",
  "After Status",
  "Comment",
  "Meta JSON",
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
    } else if (action === "getActivities") {
      result = getActivities(e.parameter);
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
    else if (action === "commentSchedule") result = commentSchedule(data);
    else if (action === "deleteScheduleComment") result = deleteScheduleComment(data);
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
  logActivitySafe_({
    action: "create_schedule",
    entityType: "schedule",
    entityId: submissionId,
    dateKey: toDateKey_(new Date(tanggalOperasi)),
    doctor: operator,
    hospital: hospital,
    beforeStatus: "",
    afterStatus: normalizeScheduleStatus_("jadwal_baru"),
    comment: String(data.comment || ""),
    actor: getPayloadActor_(data),
    meta: {
      source: "appscript",
      status: "jadwal_baru",
      hasPreXray: Boolean(preUploaded.url || preUploaded.fileId || data.preXrayUrl),
      hasPostXray: Boolean(postUploaded.url || postUploaded.fileId || data.postXrayUrl),
    },
  });

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
  const beforeStatus = extractStatusFromKeterangan_(String(rowObj["Keterangan"] || ""));
  const beforePreUrl = String(rowObj["Pre Xray URL"] || "");
  const beforePostUrl = String(rowObj["Post Xray URL"] || "");

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
  const beforePreId = oldPreId || extractDriveFileId_(beforePreUrl);
  const beforePostId = oldPostId || extractDriveFileId_(beforePostUrl);

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
  const afterStatus =
    normalizeScheduleStatus_(String(data.status || "")) ||
    extractStatusFromKeterangan_(String(rowObj["Keterangan"] || "")) ||
    beforeStatus ||
    "jadwal_baru";
  const afterPreId = preResult.fileId || extractDriveFileId_(String(preResult.url || ""));
  const afterPostId = postResult.fileId || extractDriveFileId_(String(postResult.url || ""));
  const preChanged = String(beforePreId || "") !== String(afterPreId || "") || beforePreUrl !== String(preResult.url || "");
  const postChanged = String(beforePostId || "") !== String(afterPostId || "") || beforePostUrl !== String(postResult.url || "");
  const statusChanged = beforeStatus !== afterStatus;
  logActivitySafe_({
    action: "update_schedule",
    entityType: "schedule",
    entityId: submissionId,
    dateKey: toDateKey_(rowObj["Tanggal Operasi"]),
    doctor: String(rowObj["Operator"] || ""),
    hospital: String(rowObj["Hospital"] || ""),
    beforeStatus: beforeStatus,
    afterStatus: afterStatus,
    comment: String(data.comment || ""),
    actor: getPayloadActor_(data),
    meta: {
      source: "appscript",
      status: afterStatus,
      statusChanged: statusChanged,
      hasPreXray: Boolean(preResult.url || preResult.fileId),
      hasPostXray: Boolean(postResult.url || postResult.fileId),
      deletePreXray: Boolean(data.deletePreXray),
      deletePostXray: Boolean(data.deletePostXray),
      preChanged: preChanged,
      postChanged: postChanged,
    },
  });

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
  const beforeStatus = extractStatusFromKeterangan_(String(rowObj["Keterangan"] || ""));

  const preId = String(rowObj["Pre Xray File ID"] || extractDriveFileId_(String(rowObj["Pre Xray URL"] || "")) || "");
  const postId = String(rowObj["Post Xray File ID"] || extractDriveFileId_(String(rowObj["Post Xray URL"] || "")) || "");
  if (preId) deleteDriveFileSafe_(preId);
  if (postId) deleteDriveFileSafe_(postId);

  logActivitySafe_({
    action: "delete_schedule",
    entityType: "schedule",
    entityId: submissionId,
    dateKey: toDateKey_(rowObj["Tanggal Operasi"]),
    doctor: String(rowObj["Operator"] || ""),
    hospital: String(rowObj["Hospital"] || ""),
    beforeStatus: beforeStatus,
    afterStatus: "",
    comment: String(data.comment || ""),
    actor: getPayloadActor_(data),
    meta: { source: "appscript", status: beforeStatus },
  });

  sheet.deleteRow(rowNumber);
  return { submissionId: submissionId, message: "Data + foto berhasil dihapus." };
}

function commentSchedule(data) {
  const submissionId = String(data.submissionId || data.entityId || "").trim();
  const comment = String(data.comment || data.komentar || "").trim();
  const replyTo = String(data.replyTo || data.replyToCommentId || "").trim();
  if (!submissionId) throw new Error("submissionId/entityId komentar wajib diisi.");
  if (!comment) throw new Error("Komentar tidak boleh kosong.");

  const rowNumber = findRowBySubmissionId(submissionId);
  if (!rowNumber) throw new Error("Jadwal untuk komentar tidak ditemukan.");
  const sheet = getOrCreateSheet_();
  const headerMap = toHeaderMap_(getHeaders_(sheet));
  const rowObj = readRowByHeaders_(sheet, rowNumber, headerMap);
  const status = extractStatusFromKeterangan_(String(rowObj["Keterangan"] || ""));

  logActivitySafe_({
    action: "comment_schedule",
    entityType: "schedule",
    entityId: submissionId,
    dateKey: toDateKey_(rowObj["Tanggal Operasi"]),
    doctor: String(rowObj["Operator"] || ""),
    hospital: String(rowObj["Hospital"] || ""),
    beforeStatus: status,
    afterStatus: status,
    comment: comment,
    actor: getPayloadActor_(data),
    meta: {
      source: "appscript",
      status: status,
      replyTo: replyTo,
    },
  });

  return {
    message: "Komentar berhasil disimpan.",
    entityId: submissionId,
    comment: comment,
    replyTo: replyTo,
  };
}

function deleteScheduleComment(data) {
  const submissionId = String(data.submissionId || data.entityId || "").trim();
  const commentId = String(data.commentId || data.logId || data.id || "").trim();
  if (!submissionId) throw new Error("submissionId/entityId komentar wajib diisi.");
  if (!commentId) throw new Error("commentId/logId komentar wajib diisi.");

  const actor = getPayloadActor_(data);
  const activitySheet = getOrCreateActivitySheet_();
  const headerMap = toHeaderMap_(getHeaders_(activitySheet));
  const rowNumber = findActivityRowByLogId_(activitySheet, headerMap, commentId);
  if (!rowNumber) throw new Error("Komentar tidak ditemukan.");

  const rowObj = readRowByHeaders_(activitySheet, rowNumber, headerMap);
  const action = String(rowObj["Action"] || "").trim();
  const entityType = String(rowObj["Entity Type"] || "").trim().toLowerCase();
  const entityId = String(rowObj["Entity ID"] || "").trim();
  if (action !== "comment_schedule" || entityType !== "schedule") {
    throw new Error("Data bukan komentar jadwal.");
  }
  if (entityId !== submissionId) {
    throw new Error("Komentar tidak cocok dengan jadwal yang dipilih.");
  }

  const rowActorEmail = String(rowObj["Actor Email"] || "").trim().toLowerCase();
  const actorEmail = String(actor.email || "").trim().toLowerCase();
  const actorRole = String(actor.role || "").trim().toLowerCase();
  const canDelete = actorRole === "admin" || (actorEmail && actorEmail === rowActorEmail);
  if (!canDelete) {
    throw new Error("Komentar hanya bisa dihapus oleh pembuat komentar atau admin.");
  }

  const deletedCommentText = String(rowObj["Comment"] || "").trim();
  const deletedDateKey = String(rowObj["Date Key"] || "").trim();
  const deletedDoctor = String(rowObj["Doctor"] || "").trim();
  const deletedHospital = String(rowObj["Hospital"] || "").trim();
  const deletedStatus = normalizeScheduleStatus_(String(rowObj["After Status"] || rowObj["Before Status"] || ""));
  activitySheet.deleteRow(rowNumber);

  logActivitySafe_({
    action: "delete_schedule_comment",
    entityType: "schedule",
    entityId: submissionId,
    dateKey: deletedDateKey,
    doctor: deletedDoctor,
    hospital: deletedHospital,
    beforeStatus: deletedStatus,
    afterStatus: deletedStatus,
    comment: "",
    actor: actor,
    meta: {
      source: "appscript",
      status: deletedStatus,
      deletedCommentId: commentId,
      deletedCommentText: deletedCommentText,
    },
  });

  return {
    message: "Komentar berhasil dihapus.",
    entityId: submissionId,
    commentId: commentId,
  };
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

function findActivityRowByLogId_(sheet, headerMap, logId) {
  const key = String(logId || "").trim();
  if (!key) return null;
  const idCol = headerMap["Log ID"];
  if (!idCol) throw new Error("Header 'Log ID' pada ActivityLog tidak ditemukan.");
  if (sheet.getLastRow() < 2) return null;

  const values = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().flat();
  const rowIndex = values.findIndex(function (value) {
    return String(value || "").trim() === key;
  });
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

function getActivities(params) {
  const sheet = getOrCreateActivitySheet_();
  if (sheet.getLastRow() < 2) return [];

  const headers = getHeaders_(sheet);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const limitRaw = Number(params && params.limit ? params.limit : 120);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 120));
  const sinceMsRaw = Number(params && params.sinceMs ? params.sinceMs : 0);
  const sinceMs = Number.isFinite(sinceMsRaw) ? sinceMsRaw : 0;
  const dateKey = String((params && params.dateKey) || "").trim();
  const entityType = String((params && params.entityType) || "").trim().toLowerCase();
  const entityId = String((params && params.entityId) || "").trim();
  const action = String((params && params.auditAction) || (params && params.actionType) || "").trim();

  const mapped = rows
    .map(function (row) {
      const obj = {};
      headers.forEach(function (header, index) {
        obj[header] = row[index];
      });
      const createdAt = toIsoString_(obj["Timestamp"]);
      const createdAtMs = Number(obj["Timestamp Ms"] || new Date(createdAt).getTime() || 0);
      const actionValue = String(obj["Action"] || "").trim();
      const entityTypeValue = String(obj["Entity Type"] || "").trim().toLowerCase();
      const entityIdValue = String(obj["Entity ID"] || "").trim();
      const dateKeyValue = String(obj["Date Key"] || "").trim();
      const beforeStatus = normalizeScheduleStatus_(String(obj["Before Status"] || ""));
      const afterStatus = normalizeScheduleStatus_(String(obj["After Status"] || ""));
      const comment = String(obj["Comment"] || "").trim();
      const meta = parseJsonSafeObject_(String(obj["Meta JSON"] || ""));
      const doctor = String(obj["Doctor"] || "");
      const hospital = String(obj["Hospital"] || "");
      const before = {};
      const after = {};
      if (beforeStatus) before.status = beforeStatus;
      if (afterStatus) after.status = afterStatus;
      if (doctor) {
        before.Operator = doctor;
        after.Operator = doctor;
      }
      if (hospital) {
        before.Hospital = hospital;
        after.Hospital = hospital;
      }
      if (comment) after.comment = comment;
      return {
        id: String(obj["Log ID"] || ""),
        createdAt: createdAt,
        createdAtMs: createdAtMs,
        action: actionValue,
        entityType: entityTypeValue || "schedule",
        entityId: entityIdValue,
        dateKey: dateKeyValue,
        actor: {
          uid: "",
          email: String(obj["Actor Email"] || ""),
          name: String(obj["Actor Name"] || ""),
          username: String(obj["Actor Username"] || ""),
          role: String(obj["Actor Role"] || ""),
        },
        before: before,
        after: after,
        meta: Object.assign(
          {
            comment: comment,
            source: "appscript",
            doctor: doctor,
            hospital: hospital,
            status: afterStatus || beforeStatus,
          },
          meta
        ),
      };
    })
    .filter(function (item) {
      if (!item.id || !item.createdAt) return false;
      if (sinceMs > 0 && item.createdAtMs <= sinceMs) return false;
      if (dateKey && item.dateKey !== dateKey) return false;
      if (entityType && item.entityType !== entityType) return false;
      if (entityId && item.entityId !== entityId) return false;
      if (action && item.action !== action) return false;
      return true;
    })
    .sort(function (a, b) {
      return Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0);
    })
    .slice(0, limit)
    .map(function (item) {
      delete item.createdAtMs;
      delete item.dateKey;
      return item;
    });

  return mapped;
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

function getOrCreateActivitySheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ACTIVITY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ACTIVITY_SHEET_NAME);
  ensureActivityHeaders_(sheet);
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

function ensureActivityHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, ACTIVITY_REQUIRED_HEADERS.length).setValues([ACTIVITY_REQUIRED_HEADERS]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) { return String(h || "").trim(); });
  let nextCol = current.length + 1;
  ACTIVITY_REQUIRED_HEADERS.forEach(function (header) {
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

function getPayloadActor_(data) {
  const actor = data && typeof data === "object" ? data.__actor || {} : {};
  return {
    name: String(actor.name || "").trim(),
    email: String(actor.email || "").trim().toLowerCase(),
    username: String(actor.username || "").trim().toLowerCase(),
    role: String(actor.role || "").trim().toLowerCase(),
  };
}

function toDateKey_(value) {
  const date = value instanceof Date ? value : new Date(String(value || ""));
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function toIsoString_(value) {
  if (value instanceof Date) return value.toISOString();
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function parseJsonSafeObject_(text) {
  const raw = String(text || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (error) {
    Logger.log(error);
  }
  return {};
}

function normalizeScheduleStatus_(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return "";
  if (value.indexOf("jadwal") !== -1 && value.indexOf("baru") !== -1) return "jadwal_baru";
  if (value === "new") return "jadwal_baru";
  if (value.indexOf("tunda") !== -1 || value.indexOf("delay") !== -1) return "tunda";
  if (value.indexOf("batal") !== -1 || value.indexOf("cancel") !== -1) return "batal";
  if (value.indexOf("resched") !== -1) return "reschedule";
  if (value.indexOf("selesai") !== -1 || value.indexOf("done") !== -1 || value.indexOf("finish") !== -1) {
    return "selesai";
  }
  return value;
}

function extractStatusFromKeterangan_(text) {
  const source = String(text || "");
  const match = source.match(/status:\s*([^|]+)/i);
  return normalizeScheduleStatus_(match && match[1] ? match[1] : "");
}

function appendActivityLog_(payload) {
  const sheet = getOrCreateActivitySheet_();
  const headerMap = toHeaderMap_(getHeaders_(sheet));
  const timestamp = new Date();
  const actor = payload.actor || {};
  const rowObj = {};
  rowObj["Log ID"] = String(timestamp.getTime()) + "_" + Math.random().toString(36).slice(2, 9);
  rowObj["Timestamp"] = timestamp;
  rowObj["Timestamp Ms"] = timestamp.getTime();
  rowObj["Action"] = String(payload.action || "");
  rowObj["Entity Type"] = String(payload.entityType || "schedule");
  rowObj["Entity ID"] = String(payload.entityId || "");
  rowObj["Date Key"] = String(payload.dateKey || "");
  rowObj["Actor Name"] = String(actor.name || "");
  rowObj["Actor Email"] = String(actor.email || "");
  rowObj["Actor Username"] = String(actor.username || "");
  rowObj["Actor Role"] = String(actor.role || "");
  rowObj["Doctor"] = String(payload.doctor || "");
  rowObj["Hospital"] = String(payload.hospital || "");
  rowObj["Before Status"] = normalizeScheduleStatus_(String(payload.beforeStatus || ""));
  rowObj["After Status"] = normalizeScheduleStatus_(String(payload.afterStatus || ""));
  rowObj["Comment"] = String(payload.comment || "");
  rowObj["Meta JSON"] = JSON.stringify(payload.meta || {});
  appendRowByHeaders_(sheet, headerMap, rowObj);
}

function logActivitySafe_(payload) {
  try {
    appendActivityLog_(payload);
  } catch (error) {
    Logger.log("Gagal menulis ActivityLog: " + error);
  }
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
