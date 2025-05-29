export type Jadwal = {
    tanggal: string;
    rumahSakit: string;
    alamat: string;
    dokter: string;
    waktuMulai: string;
    waktuSelesai: string;
    status: string;
  };
  
  export function normalizeJadwalData(raw: any[]): Jadwal[] {
    return raw
      .filter((item) => item["Rumah Sakit"] && item["Dokter"])
      .map((item) => ({
        tanggal: formatTanggal(item["Tanggal"]),
        rumahSakit: item["Rumah Sakit"] || "-",
        alamat: item["Alamat"] || "-",
        dokter: item["Dokter"] || "-",
        waktuMulai: formatJam(item["Waktu Visit"]),
        waktuSelesai: formatJam(item[""] || item["Waktu Selesai"]),
        status: item["Status"] || "Belum Visit",
      }));
  }
  
  function formatJam(jamISO: string): string {
    if (!jamISO) return "-";
    const date = new Date(jamISO);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  
  function formatTanggal(tanggalISO: string): string {
    if (!tanggalISO) return "-";
    const date = new Date(tanggalISO);
    return isNaN(date.getTime()) ? tanggalISO : date.toLocaleDateString("id-ID");
  }
  