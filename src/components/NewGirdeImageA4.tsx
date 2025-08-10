"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Search,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowBigDown,
} from "lucide-react";

interface DriveImage {
  no: number | string;
  fileName: string;
  fileUrl: string;
  googleDriveId: string;
  createdAt: string;
}

interface Sheet1Image {
  no: number | string;
  date: string;
  keterangan: string;
}

interface ApiResponse {
  sheetName: string;
  driveImages: DriveImage[];
  imagesForSheet1: Sheet1Image[];
}

interface MergedImage extends DriveImage {
  date: string;
  keterangan?: string;
}

export default function DriveImageGridA4Pagination() {
  const [images, setImages] = useState<MergedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec?sheet=ALL"
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: ApiResponse = await res.json();
        const merged: MergedImage[] = data.driveImages.map((img) => {
          const match = data.imagesForSheet1.find(
            (i) => String(i.no) === String(img.no)
          );
          return {
            ...img,
            keterangan: match?.keterangan || "",
            date: match?.date || img.createdAt,
          };
        });

        setImages(merged);
      } catch (error) {
        console.error("Gagal fetch data gambar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const formatDriveUrl = (url: string) =>
    url
      .replace(
        "https://drive.google.com/file/d/",
        "https://drive.google.com/uc?export=view&id="
      )
      .replace("/view?usp=drivesdk", "");

  const proxyUrl = (url: string) =>
    `/api/proxy-image?url=${encodeURIComponent(formatDriveUrl(url))}`;

  const filteredImages = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return images.filter((img) => {
      const matchName = img.fileName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchDate = filterDate
        ? img.date >= filterDate && img.date <= today
        : true;
      return matchName && matchDate;
    });
  }, [images, search, filterDate]);

  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);

  const currentImages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredImages.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredImages, currentPage]);

  const exportPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "letter");
      const tanggalCetak = new Date().toLocaleDateString("id-ID");

      const pages = Math.ceil(filteredImages.length / itemsPerPage);

      for (let page = 1; page <= pages; page++) {
        const startIndex = (page - 1) * itemsPerPage;
        const pageImages = filteredImages.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        const tempDiv = document.createElement("div");
        tempDiv.style.width = "210mm";
        tempDiv.style.height = "292mm";
        tempDiv.style.background = "white";
        tempDiv.style.display = "flex";
        tempDiv.style.flexDirection = "column";
        tempDiv.style.padding = "4mm";
        tempDiv.style.boxSizing = "border-box";

        const title = document.createElement("h2");
        title.innerText = `Laporan Dokumentasi Foto - ${tanggalCetak}`;
        title.style.textAlign = "center";
        title.style.fontSize = "11pt";
        title.style.margin = "0 0 5mm 0";
        tempDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(3, 1fr)";
        grid.style.gap = "2px";
        grid.style.flex = "1";

        for (const img of pageImages) {
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.flexDirection = "column";

          const imgElem = document.createElement("img");
          imgElem.src = proxyUrl(img.fileUrl);
          imgElem.crossOrigin = "anonymous";
          imgElem.style.width = "100%";
          imgElem.style.aspectRatio = "3 / 6";
          imgElem.style.objectFit = "cover";
          imgElem.style.objectPosition = "top";

          const caption = document.createElement("div");
          caption.innerText = img.keterangan || img.fileName;
          caption.style.fontSize = "8pt";
          caption.style.textAlign = "center";
          caption.style.marginTop = "1px";

          wrapper.appendChild(imgElem);
          wrapper.appendChild(caption);
          grid.appendChild(wrapper);
        }

        tempDiv.appendChild(grid);

        document.body.appendChild(tempDiv);
        await new Promise((resolve) => setTimeout(resolve, 500)); // tunggu gambar load
        const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL("image/png");
        const pageWidth = 210;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (page > 1) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save("laporan-dokumentasi.pdf");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-10 text-gray-500">
        Loading gambar...
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="w-full flex justify-center py-10 text-gray-500">
        Tidak ada gambar ditemukan
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      {/* Overlay Loading PDF */}
      {downloading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 text-green-500 rounded-4xl shadow text-lg font-semibold flex justify-center
          items-center ">
            Sedang membuat PDF <ArrowBigDown className="animate-bounce" />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama..."
            className="w-full pl-8 pr-2 py-1 rounded-md border text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="date"
            className="pl-8 pr-2 py-1 rounded-md border text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
        >
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Judul di UI */}
      <h2 className="text-center font-bold text-lg mb-2">
        Laporan Dokumentasi Foto
      </h2>

      {/* Grid A4 */}
      <div
        id="photo-grid-a4"
        className="grid grid-cols-3 gap-2 bg-white p-2 mx-auto"
        style={{ width: "210mm", height: "290mm" }}
      >
        {currentImages.map((img, index) => (
          <div
            key={img.googleDriveId}
            className="flex flex-col items-center"
            style={{ aspectRatio: "3/6" }}
          >
            <Image
              src={proxyUrl(img.fileUrl)}
              alt={img.fileName}
              width={400}
              height={533}
              priority={index === 0}
              className="object-cover object-top w-full h-full"
            />
            <p className="text-sm text-center mt-1 text-slate-500">
              {img.keterangan || img.fileName}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-2xl disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 " />
        </button>
        <span>
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border  rounded-2xl disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4 " />
        </button>
      </div>
    </div>
  );
}
