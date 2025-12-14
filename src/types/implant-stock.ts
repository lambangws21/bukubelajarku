// export interface ImplantStockItem {
//   id: string;
//   stockNo: string;      // UI alias dari noStok
//   description: string; // UI alias dari deskripsi
//   batch: string;
//   qty: number;
//   refill: number;
//   used: number;        // UI alias dari terpakai
//   totalQty: number;
//   note: string;        // UI alias dari keterangan
//   createdAt?: string;
//   updatedAt?: string | null;
// }

export type StockAction = "CREATE" | "UPDATE" | "DELETE";

export interface ImplantStockLog {
  id: string;
  stockId: string;
  action: StockAction;
  before: ImplantedFirestoreStock | null;
  after: ImplantedFirestoreStock | null;
  changedAt?: string;
}

/* ✅ BENTUK ASLI DI FIRESTORE */
export interface ImplantedFirestoreStock {
  no: number;
  noStok: string;
  deskripsi: string;
  batch: string;
  qty: number;
  refill: number;
  terpakai: number;
  totalQty: number;
  keterangan: string;
  isDeleted?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

  

export interface ImplantStockItem {
    id: string;
    no: number;
    stockNo: string;
    description: string;
    batch: string;
    qty: number;
    totalQty: number;
    used: number;
    refill: number;
    note: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  

 // ✅ BASE DATA SESUAI HEADER EXCEL BARU
export interface ImplantStockItemBase {
    no: number;           // NO
    stockNo: string;     // No Stok
    description: string; // Deskripsi
    batch: string;       // Batch
    qty: number;         // Qty
    totalQty: number;   // Total Qty
    used: number;       // TERPAKAI
    refill: number;     // REFILL
    note: string;       // KET.
    createdAt?: string;
    updatedAt?: string;
  }
  
  // ✅ FIRESTORE DOC
  export interface ImplantStockItem extends ImplantStockItemBase {
    id: string;
  }
  
  
  
  export interface RawPriceRow {
    No: string;
    NoStok: string;
    Deskripsi: string;
    Batch: string;
    Qty: string;
    TotalQty: string;
    TERPAKAI: string;
    REFILL: string;
    KET: string;
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
  