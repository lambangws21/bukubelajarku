// File: src/app/api/advance/getDriveImages/route.ts
import { NextResponse } from 'next/server';

const SHEET2_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw5ACQflrxjlsoY_ZvjZQs7Xd8f2lFnzNjOtXPLW_xx3bHb8TNK02VX0ghXLbE7QDnF/exec';

interface DriveImage {
  no: string | number;
  fileName?: string;
  fileUrl?: string;
  googleDriveId: string;
  createdAt?: string;
}

interface Sheet2Response {
  status: string;
  driveImages: DriveImage[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    if (!statusParam) {
      return NextResponse.json(
        { status: 'error', message: 'Missing status parameter' },
        { status: 400 }
      );
    }

    const res = await fetch(SHEET2_ENDPOINT);
    const json: Sheet2Response = await res.json();

    if (json.status !== 'success' || !Array.isArray(json.driveImages)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid sheet response' },
        { status: 500 }
      );
    }

    // Cocokkan dengan `no` dari driveImages (bisa berupa number atau string)
    const matchedRow = json.driveImages.find(row => String(row.no) === String(statusParam));

    if (!matchedRow || !matchedRow.googleDriveId) {
      return NextResponse.json(
        { status: 'error', message: 'Image not found for the given status' },
        { status: 404 }
      );
    }

    const imageUrls = matchedRow.googleDriveId
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
      .map(id => `https://drive.google.com/uc?export=view&id=${id}`);

    return NextResponse.json({ status: 'success', images: imageUrls });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
