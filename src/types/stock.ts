export interface StockItem {
    id: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
    lokasi: string;
    keterangan?: string;
    tanggal: string; // format ISO (yyyy-mm-dd)
  }
// types/stock.ts
export interface Stock {
  rowNumber: number;
  stockNumber: string;
  description: string;
  quantity: number;
}


export interface StokBarang {
  noStok: string;
  deskripsi: string;
  jumlah: number;
  permintaan: string;
}

export interface StokResponse {
  status: "success" | "error";
  stokBarang?: StokBarang[];
  message?: string;
}
