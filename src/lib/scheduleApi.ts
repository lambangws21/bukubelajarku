// lib/scheduleApi.ts

import type { Schedule, ScheduleInput, ScheduleUpdate, ApiResponse } from '@/types/schedule';

// URL sekarang adalah endpoint lokal kita di Next.js
const API_BASE_URL = '/api/schedule';

/**
 * Helper generik untuk request POST ke API endpoint kita.
 * Menggunakan tipe generik `T` untuk data dan `R` untuk respons.
 */
async function postToAction<T, R>(action: string, data: T): Promise<ApiResponse<R>> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });
  // Kita asumsikan responsnya selalu sesuai dengan tipe ApiResponse<R>
  return response.json() as Promise<ApiResponse<R>>;
}

/**
 * Helper generik untuk request GET ke API endpoint kita.
 */
async function getAction<R>(params: string = ''): Promise<R> {
    const response = await fetch(`${API_BASE_URL}${params}`);
    const result: ApiResponse<R> = await response.json();
    if (result.status === 'success' && result.data) {
        return result.data;
    }
    throw new Error(result.message || 'Gagal mengambil data.');
}


// --- FUNGSI-FUNGSI API ---

// 📝 CREATE: Membuat jadwal baru
export const addSchedule = async (scheduleData: ScheduleInput): Promise<ApiResponse<{ message: string }>> => {
  return postToAction('create', scheduleData);
};

// 📖 READ: Mengambil semua jadwal (dengan filter tanggal opsional)
export const getSchedules = async (date?: string, name?: string): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (date) {
    params.append('date', date);
  }
  if (name) {
    params.append('name', name);
  }
  const queryString = params.toString();
  
  return getAction<Schedule[]>(queryString ? `?${queryString}` : '');
};

// 📖 READ: Mengambil satu jadwal berdasarkan ID
export const getScheduleById = async (rowId: number): Promise<Schedule> => {
    return getAction<Schedule>(`?id=${rowId}`);
};

// 🔧 UPDATE: Memperbarui jadwal
export const updateSchedule = async (scheduleData: ScheduleUpdate): Promise<ApiResponse<{ message: string }>> => {
  return postToAction('update', scheduleData);
};

// 🗑️ DELETE: Menghapus jadwal
export const deleteSchedule = async (rowId: number): Promise<ApiResponse<{ message: string }>> => {
  return postToAction('delete', { rowId });
};

// 📧 Mengambil daftar email TS
export const getTSEmails = async (): Promise<string[]> => {
    return getAction<string[]>(`?action=getEmails`);
};