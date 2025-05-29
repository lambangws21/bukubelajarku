"use client";
import { useEffect, useState } from 'react';

interface JadwalDokter {
  id: string;
  tanggal: string; // format: "DD/MM/YYYY"
  rumahSakit: string;
  alamat: string;
  dokter: string;
  waktuMulai: string; // format: "HH:mm"
  waktuSelesai: string; // format: "HH:mm"
  status: "Belum Visit" | "Sedang Visit" | "Sudah Visit";
}

export default function Home() {
  const [data, setData] = useState<JadwalDokter[]>([]);
  const [filterRS, setFilterRS] = useState('');
  const [form, setForm] = useState<Omit<JadwalDokter, 'id'>>({
    tanggal: '',
    rumahSakit: '',
    alamat: '',
    dokter: '',
    waktuMulai: '',
    waktuSelesai: '',
    status: 'Belum Visit',
  });

  useEffect(() => {
    fetch('/api/goJadwal')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const rumahSakitList = Array.from(new Set(data.map(d => d.rumahSakit)));

  const filtered = filterRS
    ? data.filter(d => d.rumahSakit === filterRS)
    : data;

  const handleStatusColor = (status: JadwalDokter['status']) => {
    switch (status) {
      case 'Sudah Visit': return '#d4edda';
      case 'Sedang Visit': return '#fff3cd';
      case 'Belum Visit': return '#f8d7da';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    await fetch(`/api/goJadwal?id=${id}`, { method: 'DELETE' });
    setData(data.filter(d => d.id !== id));
  };

  const handleAdd = async () => {
    const res = await fetch('/api/goJadwal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const newItem = await res.json();
    setData([...data, newItem]);
    setForm({
      tanggal: '', rumahSakit: '', alamat: '', dokter: '', waktuMulai: '', waktuSelesai: '', status: 'Belum Visit'
    });
  };

  const handleStatusChange = async (id: string, status: JadwalDokter['status']) => {
    const updated = data.map(d => d.id === id ? { ...d, status } : d);
    setData(updated);
    await fetch(`/api/goJadwal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Jadwal Visit Dokter</h1>

      <label>
        Filter Rumah Sakit:{' '}
        <select onChange={(e) => setFilterRS(e.target.value)} value={filterRS}>
          <option value="">Semua</option>
          {rumahSakitList.map(rs => (
            <option key={rs} value={rs}>{rs}</option>
          ))}
        </select>
      </label>

      <table border={1} cellPadding={8} style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Rumah Sakit</th>
            <th>Dokter</th>
            <th>Alamat</th>
            <th>Waktu Visit</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} style={{ backgroundColor: handleStatusColor(row.status) }}>
              <td>{row.tanggal}</td>
              <td>{row.rumahSakit}</td>
              <td>{row.dokter}</td>
              <td>{row.alamat}</td>
              <td>{row.waktuMulai} - {row.waktuSelesai}</td>
              <td>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row.id, e.target.value as JadwalDokter['status'])}
                >
                  <option>Belum Visit</option>
                  <option>Sedang Visit</option>
                  <option>Sudah Visit</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDelete(row.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>Tambah Jadwal</h2>
      <div style={{ display: 'grid', gap: '8px', maxWidth: 600 }}>
        <input placeholder="Tanggal (DD/MM/YYYY)" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
        <input placeholder="Rumah Sakit" value={form.rumahSakit} onChange={e => setForm({ ...form, rumahSakit: e.target.value })} />
        <input placeholder="Alamat" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} />
        <input placeholder="Dokter" value={form.dokter} onChange={e => setForm({ ...form, dokter: e.target.value })} />
        <input placeholder="Waktu Mulai (HH:mm)" value={form.waktuMulai} onChange={e => setForm({ ...form, waktuMulai: e.target.value })} />
        <input placeholder="Waktu Selesai (HH:mm)" value={form.waktuSelesai} onChange={e => setForm({ ...form, waktuSelesai: e.target.value })} />
        <button onClick={handleAdd}>Tambah</button>
      </div>
    </div>
  );
}
