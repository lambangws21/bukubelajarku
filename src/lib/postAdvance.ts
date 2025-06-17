// lib/postAdvance.ts
export async function postAdvance(tanggal: string, jumlah: number) {
    const res = await fetch('/api/advance/advancePost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'POST_ADVANCE',
        tanggal,
        jumlah
      }),
    });
  
    // ⚠️ Pastikan response berupa JSON
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await res.json() : null;
  
    // ✅ PERBAIKAN: hanya lempar error jika benar-benar error
    if (!res.ok || !data || data.status === 'error') {
      const message = data?.message || 'Gagal menyimpan advance';
      throw new Error(message);
    }
  
    return data;
  }
  