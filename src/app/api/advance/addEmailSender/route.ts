import { NextRequest, NextResponse } from 'next/server';

interface AdvanceDataItem {
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

interface Payload {
  email: string;
  pdfBase64?: string;
  filename?: string;
  namaPemohon: string;
  data: AdvanceDataItem[];
}

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwqcpWoDEqL6Be7MdVpdAQUTjYzBOelDZJffk0_Svs1TLmd7xlv8kbh8TBbDSBlNV26dg/exec';

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!rawBody) {
      return NextResponse.json(
        { status: 'error', message: 'Payload tidak valid' },
        { status: 400 }
      );
    }

    const email = String(rawBody.email || '').trim();
    const namaPemohon = String(rawBody.namaPemohon || '').trim();
    const dataRaw = Array.isArray(rawBody.data) ? rawBody.data : [];

    const normalizedData: AdvanceDataItem[] = dataRaw
      .map((item) => {
        const row = item as Record<string, unknown>;
        const tanggal = String(row.tanggal || '').trim();
        const keterangan = String(row.keterangan || '').trim();
        const jumlahCandidate = row.jumlah;
        const jumlah =
          typeof jumlahCandidate === 'number'
            ? jumlahCandidate
            : Number(String(jumlahCandidate || '').replace(/[^\d]/g, ''));
        return {
          tanggal,
          keterangan,
          jumlah: Number.isFinite(jumlah) ? jumlah : 0,
        };
      })
      .filter(
        (item) =>
          item.tanggal !== '' &&
          item.keterangan !== '' &&
          Number.isFinite(item.jumlah) &&
          item.jumlah > 0
      );

    if (!email || !namaPemohon || normalizedData.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Lengkapi email, nama pemohon, dan data advance.' },
        { status: 400 }
      );
    }

    const body: Payload = {
      email,
      namaPemohon,
      data: normalizedData,
      pdfBase64: typeof rawBody.pdfBase64 === 'string' ? rawBody.pdfBase64 : undefined,
      filename: typeof rawBody.filename === 'string' ? rawBody.filename : undefined,
    };

    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const rawResultText = await response.text();
    const result = (() => {
      try {
        return JSON.parse(rawResultText) as { status?: string; message?: string };
      } catch {
        return { status: response.ok ? 'success' : 'error', message: rawResultText || '' };
      }
    })();

    if (response.ok && result.status === 'success') {
      return NextResponse.json({
        status: 'success',
        message: result.message || 'Permintaan advance berhasil dikirim.',
      });
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message:
            result.message || `Gagal memproses permintaan advance (${response.status})`,
        },
        { status: response.status || 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
