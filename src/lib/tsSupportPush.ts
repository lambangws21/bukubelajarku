import "server-only";

import { getFirebaseAdmin } from "@/lib/firebase/admin";

const DEFAULT_TS_SUPPORT_PUSH_TOPIC = "ts_support_activity";
const PUSHABLE_ACTIONS = new Set([
  "create",
  "update",
  "delete",
  "commentSchedule",
]);

type PushActor = {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
};

type PushInput = {
  action: string;
  actor: PushActor;
  requestData: Record<string, unknown>;
  responseData: Record<string, unknown>;
};

const toText = (value: unknown) => String(value || "").trim();

const clip = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
};

const getTopic = () => {
  const customTopic = toText(process.env.FCM_TS_SUPPORT_TOPIC);
  return customTopic || DEFAULT_TS_SUPPORT_PUSH_TOPIC;
};

const isPushableAction = (action: string) => PUSHABLE_ACTIONS.has(toText(action));

const resolveScheduleId = (requestData: Record<string, unknown>, responseData: Record<string, unknown>) =>
  toText(responseData.submissionId || responseData.entityId || requestData.submissionId || requestData.entityId);

const resolveActorLabel = (actor: PushActor) => {
  const preferredName = toText(actor.name);
  if (preferredName) return preferredName;
  const preferredUsername = toText(actor.username);
  if (preferredUsername) return `@${preferredUsername}`;
  const email = toText(actor.email);
  return email || "Seseorang";
};

const buildPushContent = (input: PushInput) => {
  const action = toText(input.action);
  const actor = resolveActorLabel(input.actor);
  const hospital = toText(input.requestData.hospital || input.responseData.hospital);

  if (action === "commentSchedule") {
    const rawComment = toText(
      input.requestData.comment ||
        input.requestData.komentar ||
        input.responseData.comment
    );
    const comment = rawComment ? `: ${clip(rawComment, 90)}` : "";
    return {
      title: "Komentar agenda baru",
      body: `${actor} menambahkan komentar${comment}`,
    };
  }

  if (action === "create") {
    const hospitalLabel = hospital ? ` di ${hospital}` : "";
    return {
      title: "Agenda baru dibuat",
      body: `${actor} membuat agenda${hospitalLabel}.`,
    };
  }

  if (action === "delete") {
    const hospitalLabel = hospital ? ` (${hospital})` : "";
    return {
      title: "Agenda dihapus",
      body: `${actor} menghapus agenda${hospitalLabel}.`,
    };
  }

  if (action === "update") {
    const hospitalLabel = hospital ? ` di ${hospital}` : "";
    return {
      title: "Agenda diperbarui",
      body: `${actor} memperbarui agenda${hospitalLabel}.`,
    };
  }

  return null;
};

export const sendTsSupportPushNotification = async (input: PushInput) => {
  if (!isPushableAction(input.action)) return;

  const content = buildPushContent(input);
  if (!content) return;

  const scheduleId = resolveScheduleId(input.requestData, input.responseData);
  const clickUrl = scheduleId
    ? `/ts-support-view?scheduleId=${encodeURIComponent(scheduleId)}`
    : "/ts-support-view";

  const admin = getFirebaseAdmin();
  const actorLabel = resolveActorLabel(input.actor);
  await admin.messaging().send({
    topic: getTopic(),
    notification: {
      title: content.title,
      body: content.body,
    },
    data: {
      action: toText(input.action) || "update",
      scheduleId,
      clickUrl,
      actor: actorLabel,
      actorName: toText(input.actor.name),
      actorEmail: toText(input.actor.email).toLowerCase(),
      actorUsername: toText(input.actor.username).toLowerCase(),
      actorRole: toText(input.actor.role).toLowerCase(),
      body: content.body,
      sentAt: String(Date.now()),
    },
    webpush: {
      fcmOptions: {
        link: clickUrl,
      },
      notification: {
        title: content.title,
        body: content.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: {
          clickUrl,
        },
      },
    },
  });
};
