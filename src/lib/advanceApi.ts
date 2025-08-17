// File: lib/advanceApi.ts

const API_ENDPOINT = '/api/advance'; // Endpoint Next.js Anda

interface AdvanceData {
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

// =====================
// POST: Tambah Data Baru
// =====================
export async function postAdvance(data: AdvanceData) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      method: 'POST_ADVANCE', // Method untuk Apps Script
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Gagal menambahkan data advance.');
  }
  return await res.json();
}

// =====================
// PUT: Edit Data
// =====================
export async function putAdvance(no: number, data: AdvanceData) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST', // Menggunakan POST dengan methodOverride
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      no,
      methodOverride: 'PUT', // Memberi tahu Apps Script untuk update
      sheet: 'Sheet3', // Menentukan sheet yang akan diupdate
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Gagal mengedit data advance.');
  }
  return await res.json();
}

// =====================
// DELETE: Hapus Data
// =====================
export async function deleteAdvance(no: number) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST', // Menggunakan POST dengan methodOverride
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      no,
      methodOverride: 'DELETE', // Memberi tahu Apps Script untuk hapus
      sheet: 'Sheet3', // Menentukan sheet yang akan dihapus
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Gagal menghapus data advance.');
  }
  return await res.json();
}