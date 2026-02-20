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

export async function GET() {
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

  const defaultConfig: RemoteAppConfig = {
    latestVersion: currentVersion,
    minVersion: currentVersion,
    updateUrl: "",
    message: "",
    maintenance: false,
    maintenanceMessage: "",
  };

  const dbBaseUrl = getDatabaseBaseUrl();
  if (!dbBaseUrl) {
    return NextResponse.json(
      { currentVersion, ...defaultConfig, source: "default" as const },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const res = await fetch(`${dbBaseUrl}/appConfig.json`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(
        "[APP_CONFIG_WARN]",
        `Firebase appConfig fetch failed (${res.status}): ${res.statusText}`
      );
      return NextResponse.json(
        { currentVersion, ...defaultConfig, source: "default" as const },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const remote = (await res.json()) as RemoteAppConfig | null;
    const merged: RemoteAppConfig = { ...defaultConfig, ...(remote || {}) };

    if (!merged.latestVersion || typeof merged.latestVersion !== "string") {
      merged.latestVersion = currentVersion;
    }
    if (!merged.minVersion || typeof merged.minVersion !== "string") {
      merged.minVersion = currentVersion;
    }

    return NextResponse.json(
      { currentVersion, ...merged, source: "remote" as const },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[APP_CONFIG_ERROR]", error);
    return NextResponse.json(
      { currentVersion, ...defaultConfig, source: "default" as const },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}

