"use client";

import { useState, FormEvent } from "react";
import { motion, Variants } from "framer-motion";
import { Calendar } from "lucide-react";
import type { Schedule, ScheduleInput, TeamMember } from "@/types/schedule";
import { addSchedule } from "@/lib/scheduleApi";
import { formatNameFromEmail } from "@/utils/formatname";

// --- Data tim (email > nama) ---
const teamEmails = [
  "lambangws9@gmail.com",
  "acep.sudibyo@kbn-indo.com",
  "albert.m@kbn-indo.com",
  "andri.nugraha@kbn-indo.com",
  "Angga.azis04@gmail.com",
  "asman.nasution@kbn-indo.com",
  "dsudiana78@gmail.com",
  "Dadang.sudiana@kbn-indo.com",
  "dinar.yuningsih@kbn-indo.com",
  "kevin.harefa@kbn-indo.com",
  "widho.hardi@kbn-indo.com",
  "hendra.saputra@kbn-indo.com",
  "herlambang.wicaksono@kbn-indo.com",
  "insan.kamil@kbn-indo.com",
  "khayla.almadani@kbn-indo.com",
  "mestika.harefa@kbn-indo.com",
  "nerva.mendrofa@kbn-indo.com",
  "nobel.nitona@kbn-indo.com",
  "rockzand.yusuf@kbn-indo.com",
  "rekha.muslimah@kbn-indo.com",
  "reinhard.eyvan@kbn-indo.com",
  "rifky.hamid@kbn-indo.com",
  "sasongko.gumelar@kbn-indo.com",
  "surono.hidayat@kbn-indo.com",
  "yudit.permadi@kbn-indo.com",
];





const teamMembers: TeamMember[] = teamEmails.map((email) => ({
  email,
  name: formatNameFromEmail(email),
}));

// --- Animasi ---
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const modalVariants: Variants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 120 },
  },
  exit: { scale: 0.98, opacity: 0 },
};

// --- Props ---
export type AddScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleToEdit?: Schedule | null;
  onAddPending?: (schedule: ScheduleInput) => void;
};

// --- Komponen Utama ---
function NewAddScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  onAddPending,
}: AddScheduleModalProps) {
  const [tanggalOperasi, setTanggalOperasi] = useState("");
  const [formData, setFormData] = useState<ScheduleInput[]>(
    teamMembers.map((tm) => ({
      tanggalOperasi: "",
      hospital: "",
      operator: "",
      keterangan: "",
      teamTs: [tm],
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Logic tinggi dinamis ---
  const cardHeight = 140; // px
  const maxCards = 3;
  const maxHeight = cardHeight * maxCards;

  // --- Update field ---
  const handleChange = (
    index: number,
    field: keyof ScheduleInput,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // --- Submit ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tanggalOperasi) {
      alert("Tanggal operasi wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      // hanya kirim jika minimal ada 1 field terisi
      const schedulesToSend: ScheduleInput[] = formData
        .filter(
          (item) =>
            item.hospital.trim() ||
            item.operator.trim() ||
            item.keterangan.trim()
        )
        .map((item) => ({
          ...item,
          tanggalOperasi,
        }));

      if (schedulesToSend.length === 0) {
        alert("Tidak ada data yang diisi, tidak ada yang dikirim.");
        return;
      }

      // kirim ke API (atau Google Sheet)
      await Promise.all(
        schedulesToSend.map((schedule) => addSchedule(schedule))
      );

      if (schedulesToSend.length > 0) {
        onAddPending?.(schedulesToSend[schedulesToSend.length - 1]);
      }

      alert(`${schedulesToSend.length} jadwal berhasil dikirim!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Gagal kirim jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-8"
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Membuat Jadwal Baru
        </h2>

        {/* Input tanggal */}
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="text-gray-500 dark:text-gray-300" size={18} />
          <input
            type="date"
            value={tanggalOperasi}
            onChange={(e) => setTanggalOperasi(e.target.value)}
            className="border rounded-xl w-80 px-3 py-2 bg-transparent flex-1 text-gray-800 dark:text-gray-200 dark:border-gray-600"
          />
        </div>

        {/* List Card */}
        <div
          className="space-y-4 transition-all"
          style={{
            maxHeight: formData.length > maxCards ? maxHeight : "auto",
            overflowY: formData.length > maxCards ? "auto" : "visible",
          }}
        >
          {formData.map((item, index) => (
            <motion.div
              key={item.teamTs[0].email}
              whileHover={{ scale: 1.01 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2"
              style={{ height: `${cardHeight}px` }}
            >
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {item.teamTs[0].name}
              </p>

              <div className="flex gap-2">
                <input
                  placeholder="Input Hospital"
                  value={item.hospital}
                  onChange={(e) =>
                    handleChange(index, "hospital", e.target.value)
                  }
                  className="flex-1 border w-36 rounded-lg p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
                <input
                  placeholder="Input Operator"
                  value={item.operator}
                  onChange={(e) =>
                    handleChange(index, "operator", e.target.value)
                  }
                  className="flex-1 border w-36 rounded-lg p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              <input
                placeholder="Input Keterangan Tindakan"
                value={item.keterangan}
                onChange={(e) =>
                  handleChange(index, "keterangan", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </motion.div>
          ))}
        </div>

        {/* Button */}
        {/* Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-full border border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Batal
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Jadwal"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
export default NewAddScheduleModal;
