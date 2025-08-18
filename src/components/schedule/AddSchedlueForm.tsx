'use client';

// Full AddScheduleModal with loading state (spinner + disabled inputs)
import { useState, FormEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Types
import type { Schedule, ScheduleInput, TeamMember } from '@/types/schedule';

// API
import { addSchedule } from '@/lib/scheduleApi';

// UI
import { User, Calendar, Home, StickyNote, Edit3, Trash2, Users } from 'lucide-react';
import { CheckboxList } from '@/components/schedule/CheckBoxList';

// --- Data Tim ---
const teamEmails = [
  "setyawijayanto@gmail.com",
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

const formatNameToTitleCase = (namePart: string) =>
  namePart
    .split('.')
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(' ');

const teamMembers: TeamMember[] = teamEmails.map((email) => ({
  email,
  name: formatNameToTitleCase(email.split('@')[0]),
}));

// --- Props & Animasi ---
export type AddScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleToEdit?: Schedule | null;
  // Dibuat opsional supaya tidak memicu TS2741 di pemanggil yang tidak memerlukan callback ini
  onAddPending?: (schedule: ScheduleInput) => void;
};

const backdropVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants: Variants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
  exit: { scale: 0.98, opacity: 0 },
};

// --- Komponen Utama ---
export function AddScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  scheduleToEdit,
  onAddPending,
}: AddScheduleModalProps) {
  const [pendingSchedules, setPendingSchedules] = useState<ScheduleInput[]>([]);
  const [currentInput, setCurrentInput] = useState({
    tanggalOperasi: '',
    keterangan: '',
    operator: '',
    hospital: '',
  });
  const [selectedTeam, setSelectedTeam] = useState<TeamMember[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Loading saat kirim

  const isEditMode = !!scheduleToEdit;
  const maxSelection = 5;

  // --- Reset & Efek ---
  const resetForm = useCallback((keepDate = false) => {
    setCurrentInput((prev) => ({
      tanggalOperasi: keepDate ? prev.tanggalOperasi : '',
      keterangan: '',
      operator: '',
      hospital: '',
    }));
    setSelectedTeam([]);
    setEditingIndex(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && scheduleToEdit) {
        const teamTsFromString = scheduleToEdit['Team TS'].split(', ');
        const fullTeamMembers = teamMembers.filter((member) => teamTsFromString.includes(member.name));
        setCurrentInput({
          tanggalOperasi: new Date(scheduleToEdit['Tanggal Operasi']).toISOString().split('T')[0],
          keterangan: scheduleToEdit.Keterangan,
          operator: scheduleToEdit.Operator,
          hospital: scheduleToEdit.Hospital,
        });
        setSelectedTeam(fullTeamMembers);
      } else {
        resetForm();
        setPendingSchedules([]);
      }
    }
  }, [isOpen, isEditMode, scheduleToEdit, resetForm]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItem = () => {
    if (!currentInput.tanggalOperasi || !currentInput.operator || !currentInput.hospital || selectedTeam.length === 0) {
      alert('Semua field dan minimal 1 anggota tim wajib diisi.');
      return;
    }
    const newSchedule: ScheduleInput = { ...currentInput, teamTs: selectedTeam };
    if (editingIndex !== null) {
      const updated = [...pendingSchedules];
      updated[editingIndex] = newSchedule;
      setPendingSchedules(updated);
    } else {
      setPendingSchedules((prev) => [...prev, newSchedule]);
    }
    resetForm(true);
  };

  const handleEditItem = (index: number) => {
    const item = pendingSchedules[index];
    setCurrentInput({
      tanggalOperasi: item.tanggalOperasi,
      keterangan: item.keterangan,
      operator: item.operator,
      hospital: item.hospital,
    });
    setSelectedTeam(item.teamTs);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => setPendingSchedules(pendingSchedules.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEditMode && scheduleToEdit) {
      // TODO: implementasi update jika diperlukan
      return;
    }
    if (pendingSchedules.length === 0) return;
    try {
      setIsSubmitting(true); // ✅ mulai loading
      const schedulesToSend = pendingSchedules.map((schedule) => ({
        ...schedule,
        recipients: schedule.teamTs.map((m) => m.email),
      }));
      await Promise.all(schedulesToSend.map((schedule) => addSchedule(schedule)));
      onAddPending?.(pendingSchedules[pendingSchedules.length - 1]); // optional callback contoh
      alert(`${pendingSchedules.length} jadwal berhasil dikirim!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Gagal mengirim jadwal:', error);
      alert('Gagal mengirim jadwal.');
    } finally {
      setIsSubmitting(false); // ✅ selesai loading
    }
  };

  // --- Render Utama ---
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => !isSubmitting && onClose()}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl rounded-2xl w-full ${
              isEditMode ? 'max-w-md' : 'max-w-5xl'
            } max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top loading bar */}
            <div className="absolute left-0 top-0 h-1 w-full overflow-hidden rounded-t-2xl">
              {isSubmitting && (
                <motion.div
                  className="h-1 w-1/3 bg-blue-600"
                  initial={{ x: '-100%' }}
                  animate={{ x: '300%' }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                />
              )}
            </div>

            <h2 className="text-2xl font-bold p-6 pb-4 text-gray-900 dark:text-white flex-shrink-0">
              {isEditMode ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
            </h2>

            {isEditMode ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {/* Konten form untuk edit (optional) */}
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-6 overflow-y-auto ">
                  <div className={`space-y-4 ${isSubmitting ? 'opacity-60 pointer-events-none ' : ''}`}>
                    {/* Form Input Kiri */}
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        name="tanggalOperasi"
                        value={currentInput.tanggalOperasi}
                        onChange={handleChange}
                        type="date"
                        disabled={isSubmitting}
                        className="pl-10 w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        name="keterangan"
                        value={currentInput.keterangan}
                        onChange={handleChange}
                        placeholder="Keterangan Tindakan"
                        disabled={isSubmitting}
                        className="pl-10 w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        name="operator"
                        value={currentInput.operator}
                        onChange={handleChange}
                        type="text"
                        placeholder="Nama Operator"
                        disabled={isSubmitting}
                        className="pl-10 w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        name="hospital"
                        value={currentInput.hospital}
                        onChange={handleChange}
                        type="text"
                        placeholder="Nama Hospital"
                        disabled={isSubmitting}
                        className="pl-10 w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 text-gray-400 w-5 h-5 z-20" />
                      <CheckboxList
                        options={teamMembers}
                        selected={selectedTeam}
                        onChange={setSelectedTeam}
                        maxSelection={maxSelection}
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleAddItem}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {editingIndex !== null ? 'Perbarui di Daftar' : 'Tambahkan ke Daftar'}
                    </motion.button>
                  </div>

                  <div className="space-y-4 bg-amber-300/60 dark:bg-amber-900/20 p-1 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Jadwal Siap Kirim ({pendingSchedules.length})
                    </h3>
                    <div className={`max-h-[500px] overflow-y-auto pr-2 ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}>
                      <AnimatePresence>
                        {pendingSchedules.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">Belum ada jadwal ditambahkan.</p>
                        ) : (
                          <motion.ul layout className="space-y-3">
                            {pendingSchedules.map((item, i) => (
                              <motion.li
                                key={i}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="border dark:border-gray-700 p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 shadow-sm"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.hospital}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Op: {item.operator}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{item.keterangan || 'Tidak ada tindakan.'}</p>
                                    <div className="mt-2 text-xs text-blue-800 dark:text-blue-300">
                                      <strong>Tim:</strong> {item.teamTs.map((m) => m.name).join(', ')}
                                    </div>
                                  </div>
                                  <div className="flex gap-3 ml-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      className="text-blue-500 hover:text-blue-400"
                                      onClick={() => handleEditItem(i)}
                                      disabled={isSubmitting}
                                      title="Edit"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className="text-red-500 hover:text-red-400"
                                      onClick={() => handleDeleteItem(i)}
                                      disabled={isSubmitting}
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 p-6 border-t dark:border-gray-700 mt-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={pendingSchedules.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Mengirim...
                      </>
                    ) : (
                      <>Kirim Semua ({pendingSchedules.length}) Jadwal</>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
