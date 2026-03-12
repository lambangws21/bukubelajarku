
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec";

const GAS_URL =
  process.env.GAS_TS_SUPPORT_URL ||
  process.env.GAS_OPERASI_URL ||
  process.env.GAS_WEB_APP_URL ||
  DEFAULT_GAS_URL;

type LoosePayload = {
  action?: string;
  data?: Record<string, unknown>;
  tanggalOperasi?: string;
  date?: string;
  hospital?: string;
  rumahSakit?: string;
  operator?: string;
  namaDokter?: string;
  tindakanOperasi?: string;
  keterangan?: string;
  teamTs?: Array<{ name?: string; email?: string }>;
  tsMembantu?: string;
  recipients?: string[] | string;
  namaPerawat?: string;
};

const parseJsonSafe = (raw: string) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const normalizeTeamTs = (payload: LoosePayload) => {
  if (Array.isArray(payload.teamTs) && payload.teamTs.length > 0) {
    return payload.teamTs
      .map((member) => ({ name: String(member?.name || "").trim() }))
      .filter((member) => member.name);
  }

  if (typeof payload.tsMembantu === "string" && payload.tsMembantu.trim()) {
    return payload.tsMembantu
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  if (typeof payload.namaPerawat === "string" && payload.namaPerawat.trim()) {
    return [{ name: payload.namaPerawat.trim() }];
  }

  return [{ name: "TS Belum Diisi" }];
};

const normalizeRecipients = (payload: LoosePayload) => {
  if (Array.isArray(payload.recipients)) {
    return payload.recipients.map((email) => String(email).trim()).filter(Boolean);
  }
  if (typeof payload.recipients === "string" && payload.recipients.trim()) {
    return payload.recipients
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeCreatePayload = (payload: LoosePayload) => {
  if (payload.action && payload.data) return payload;

  return {
    action: "create",
    data: {
      tanggalOperasi: payload.tanggalOperasi || payload.date || "",
      hospital: payload.hospital || payload.rumahSakit || "",
      operator: payload.operator || payload.namaDokter || "",
      teamTs: normalizeTeamTs(payload),
      recipients: normalizeRecipients(payload),
      keterangan: payload.keterangan || payload.tindakanOperasi || "",
    },
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoosePayload;
    const payload = normalizeCreatePayload(body);

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    const parsed = parseJsonSafe(text);
    if (parsed) {
      return NextResponse.json(parsed, { status: response.status });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Upstream Apps Script mengembalikan format non-JSON.",
        raw: text.slice(0, 300),
      },
      { status: response.ok ? 502 : response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
