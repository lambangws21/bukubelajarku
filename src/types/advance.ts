export interface AdvanceItem {
  no: number;
  tanggal: string; // format: yyyy-MM-dd
  jumlah: number;
  jenisBiaya: string;
  keterangan: string;
  klaimOleh: string;
}

export interface DataItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  status: string;
}

export interface AdvanceData {
  totalBiaya: number;
  totalAdvance: number;
  selisih: number;
  items?: AdvanceItem[];
}

export interface ApiResponse {
  status: string;
  data: DataItem[];
  advance: AdvanceData;
}
