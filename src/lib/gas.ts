import { GasResponse, StockPayload, StockRow } from "@/types/new-stock";

const API = "/api/super-sheet"; // proxy endpoint

/* -------------------------------------------
   GENERIC API WRAPPER (NO CORS EVER)
-------------------------------------------- */
async function api<T>(
  url: string,
  options: RequestInit = {}
): Promise<GasResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("API Error " + res.status);

  return res.json() as Promise<GasResponse<T>>;
}

/* -------------------------------------------
   GET
-------------------------------------------- */
export function gasGET(sheet: string) {
  return api<StockRow[]>(`${API}?sheet=${sheet}`);
}


/* -------------------------------------------
   CREATE
-------------------------------------------- */
export function gasPOST(payload: StockPayload) {
  return api<unknown>(API, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* -------------------------------------------
   UPDATE
-------------------------------------------- */
export function gasPUT(payload: StockPayload) {
  return api<unknown>(API, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/* -------------------------------------------
   DELETE
-------------------------------------------- */
export function gasDELETE(sheet: string, No: number) {
  return api<unknown>(API, {
    method: "DELETE",
    body: JSON.stringify({ sheet, No }),
  });
}

/* -------------------------------------------
   MUTASI
-------------------------------------------- */
export function gasMutasi(sheet: string, No: number, qty: number, type: "in" | "out") {
  return gasPOST({
    sheet,
    action: "mutasi",
    No,
    qty,
    type,
  });
}

/* -------------------------------------------
   DUPLICATE
-------------------------------------------- */
export function gasDuplicate(sheet: string, No: number) {
  return gasPOST({ sheet, action: "duplicate", No });
}

/* -------------------------------------------
   KPI
-------------------------------------------- */
export async function gasKPI(sheet: string) {
  return api<{ kpi: unknown }>(`${API}?sheet=${sheet}&action=kpi`);
}

/* -------------------------------------------
   BACKUP
-------------------------------------------- */
export async function gasBackup() {
  return api<{ backupUrl: string }>(`${API}?action=backup`);
}

/* -------------------------------------------
   EXPORT PDF
-------------------------------------------- */
export function gasExportPDF(sheet: string) {
  return `${API}?sheet=${sheet}&action=pdf`;
}

/* -------------------------------------------
   HISTORY
-------------------------------------------- */
export interface StockHistoryRow {
    Timestamp: string;
    Action: string;
    Sheet: string;
    No: number;
    Before: string;
    After: string;
    By: string;
  }
  
  export function gasGetHistory(sheet: string, No: number) {
    const params = new URLSearchParams({
      sheet: "History",
      targetSheet: sheet,
      No: String(No),
    });
  
    return api<StockHistoryRow[]>(`${API}?${params.toString()}`);
  }
  