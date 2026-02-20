"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { toSafeImageSrc } from "@/lib/googleDriveImage";

interface RiwayatOperasi {
  no: number;
  dokter: string;
  namaPasien: string;
  rumahSakit: string;
  implant: string;
  pre?: string;
  post?: string;
}

export default function RiwayatOperasiPage() {
  const [data, setData] = useState<RiwayatOperasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false); // Modal Form
  const [imageView, setImageView] = useState<{
    url: string;
    title: string;
  } | null>(null); // Modal Image
  const [formData, setFormData] = useState({
    dokter: "",
    namaPasien: "",
    rumahSakit: "",
    implant: "",
    preFile: null as File | null,
    postFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  const formatDriveUrl = (value?: string) => toSafeImageSrc(value);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/riwayat-operasi-update");
      const json = await res.json();
      if (json.status === "success") {
        setData(json.data);
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [`${name}File`]: files[0],
      }));
    }
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true); // Mulai loading
    try {
      let preBase64 = "";
      let postBase64 = "";
      if (formData.preFile) preBase64 = await convertToBase64(formData.preFile);
      if (formData.postFile)
        postBase64 = await convertToBase64(formData.postFile);

      const res = await fetch("/api/riwayat-operasi", {
        method: "POST",
        body: JSON.stringify({
          dokter: formData.dokter,
          namaPasien: formData.namaPasien,
          rumahSakit: formData.rumahSakit,
          implant: formData.implant,
          pre: preBase64,
          post: postBase64,
        }),
      });

      const result = await res.json();
      if (result.status === "success") {
        toast.success("Riwayat operasi berhasil ditambahkan");
        setFormData({
          dokter: "",
          namaPasien: "",
          rumahSakit: "",
          implant: "",
          preFile: null,
          postFile: null,
        });
        setFormOpen(false);
        fetchData();
      } else {
        toast.error(result.message || "Gagal menambahkan data");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false); // Selesai loading
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Tombol buka modal form */}
      <div className="flex justify-end">
        <button
          onClick={() => setFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Tambah Riwayat Operasi
        </button>
      </div>

      {/* Card */}
      {loading ? (
        <p className="text-center text-gray-500">Memuat data...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {item.namaPasien}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Dokter: {item.dokter}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  RS: {item.rumahSakit}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Implant: {item.implant}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div
                  className="relative w-full h-40 cursor-pointer"
                  onClick={() =>
                    setImageView({
                      url: formatDriveUrl(item.pre),
                      title: `Pre - ${item.namaPasien}`,
                    })
                  }
                >
                  <SafeImage
                    src={formatDriveUrl(item.pre)}
                    alt={`Pre - ${item.namaPasien}`}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    Pre
                  </div>
                </div>
                <div
                  className="relative w-full h-40 cursor-pointer"
                  onClick={() =>
                    setImageView({
                      url: formatDriveUrl(item.post),
                      title: `Post - ${item.namaPasien}`,
                    })
                  }
                >
                  <SafeImage
                    src={formatDriveUrl(item.post)}
                    alt={`Post - ${item.namaPasien}`}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    Post
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg space-y-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-xl font-bold dark:text-white">
                Tambah Riwayat Operasi
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="dokter"
                  placeholder="Nama Dokter"
                  value={formData.dokter}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="text"
                  name="namaPasien"
                  placeholder="Nama Pasien"
                  value={formData.namaPasien}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="text"
                  name="rumahSakit"
                  placeholder="Rumah Sakit"
                  value={formData.rumahSakit}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="text"
                  name="implant"
                  placeholder="Implant"
                  value={formData.implant}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                  required
                />
                <div>
                  <label className="block mb-1 dark:text-white">Foto Pre</label>
                  <input
                    type="file"
                    name="pre"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 dark:text-white">
                    Foto Post
                  </label>
                  <input
                    type="file"
                    name="post"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 border rounded dark:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded text-white w-28 flex justify-center items-center ${
                      submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {submitting ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                        ></path>
                      </svg>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Image View */}
      <AnimatePresence>
        {imageView && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageView(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative"
            >
              <SafeImage
                src={imageView.url}
                alt={imageView.title}
                className="rounded-lg object-contain max-h-[90vh]"
                style={{ width: "100%", height: "100%" }} 
              />
              <p className="text-white text-center mt-2">{imageView.title}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
