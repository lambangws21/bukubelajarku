export interface HistoryRow {
    Timestamp: string;
    Action: "CREATE" | "UPDATE" | "DELETE" | "MUTASI" | string;
    Sheet: string;
    No: number;
    Before: string;
    After: string;
    by: string;
  }
  
  export interface HistoryResponse {
    status: "success" | "error";
    sheet: string;
    data: HistoryRow[];
  }
  