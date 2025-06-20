import { NextRequest, NextResponse } from 'next/server';

interface AdvanceDataItem {
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

interface Payload {
  email: string;
  pdfBase64: string;
  filename?: string;
  namaPemohon: string;
  data: AdvanceDataItem[];
}

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwqcpWoDEqL6Be7MdVpdAQUTjYzBOelDZJffk0_Svs1TLmd7xlv8kbh8TBbDSBlNV26dg/exec';

export async function POST(req: NextRequest) {
  try {
    const body: Payload = await req.json();

    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result: { status: string; message: string } = await response.json();

    if (result.status === 'success') {
      return NextResponse.json({ status: 'success', message: result.message });
    } else {
      return NextResponse.json({ status: 'error', message: result.message }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
