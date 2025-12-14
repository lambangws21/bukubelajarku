// Baris data utama
export interface StockRow {
    No: number;
    NoStok: string;
    Deskripsi: string;
    Batch: string;
    Qty: number;
    TotalQty: number;
    TERPAKAI: number;
    REFILL: number;
    KET: string;
  }
  
  // Response standar dari Apps Script
  export interface GasResponse<T> {
    status: "success" | "error";
    message?: string;
    data?: T;
    No?: number;
    newQty?: number;
    backupUrl?: string;
    kpi?: unknown;
  }
  
  
  // Payload POST/PUT untuk create/update
  export type StockPayload =
  | {
      sheet: string;
      action: StockAction;
      No?: number;
      qty: number;
      type?: "in" | "out";
      data?: StockRow;
    }
  | {
      sheet: string;
      action: "duplicate";
      No?: number;
    }
  | {
      sheet?: string;
      No?: number;
      NoStok?: string;
      Deskripsi?: string;
      Batch?: string;
      Qty?: number;
      TotalQty?: number;
      TERPAKAI?: number;
      REFILL?: number;
      KET?: string;
    };

  
  // Mutasi stok (IN / OUT)
  export type MutationType = "in" | "out";
  
  export interface MutationPayload {
    type: MutationType;
    No: number;
    qty: number;
    note?: string;
  }
  
  export interface StockRow {
    No: number;
    NoStok: string;
    Deskripsi: string;
    Batch: string;
    Qty: number;
    TotalQty: number;
    TERPAKAI: number;
    REFILL: number;
    KET: string;
  }
  
  export type StockAction =
  | "create"
  | "update"
  | "delete"
  | "duplicate"
  | "mutasi";



  export interface MutationPayload {
    No: number;
    type: "in" | "out";
    qty: number;
    note?: string;
  }
  
//   export interface GasResponse {
//     status: "success" | "error";
//     message?: string;
//     data?: StockRow[];
//   }
  