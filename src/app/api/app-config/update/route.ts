import { NextResponse } from "next/server";

type RemoteAppConfig = {
  latestVersion?: string;
  minVersion?: string;
  updateUrl?: string;
  message?: string;
  maintenance?: boolean;
  maintenanceMessage?: string;
};

const getDatabaseBaseUrl = () => {
  const raw =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "";
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed || null;
};

const getBearerToken = (req: Request) => {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

export async function POST(req: Request) {
  const adminToken = process.env.APP_CONFIG_ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json(
      { error: "APP_CONFIG_ADMIN_TOKEN belum diset di server." },
      { status: 501 }
    );
  }

  const token = getBearerToken(req);
  if (!token || token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbBaseUrl = getDatabaseBaseUrl();
  if (!dbBaseUrl) {
    return NextResponse.json(
      { error: "FIREBASE_DATABASE_URL / NEXT_PUBLIC_FIREBASE_DATABASE_URL belum diset." },
      { status: 500 }
    );
  }

  let body: RemoteAppConfig;
  try {
    body = (await req.json()) as RemoteAppConfig;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  if (body.latestVersion && typeof body.latestVersion !== "string") {
    return NextResponse.json(
      { error: "latestVersion harus string." },
      { status: 400 }
    );
  }
  if (body.minVersion && typeof body.minVersion !== "string") {
    return NextResponse.json({ error: "minVersion harus string." }, { status: 400 });
  }

  const patch: RemoteAppConfig = {
    latestVersion: body.latestVersion,
    minVersion: body.minVersion,
    updateUrl: body.updateUrl,
    message: body.message,
    maintenance: typeof body.maintenance === "boolean" ? body.maintenance : undefined,
    maintenanceMessage: body.maintenanceMessage,
  };

  try {
    const res = await fetch(`${dbBaseUrl}/appConfig.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Gagal update appConfig (${res.status}): ${text || res.statusText}`,
        },
        { status: 502 }
      );
    }

    const updated = (await res.json()) as RemoteAppConfig;
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error("[APP_CONFIG_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Firebase untuk update appConfig." },
      { status: 502 }
    );
  }
}

