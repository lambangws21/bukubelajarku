// types/schedule.ts

// Tipe untuk satu anggota tim
export type TeamMember = {
  name: string;
  email: string;
};

// Tipe untuk input form
export type ScheduleInput = {
  tanggalOperasi: string;
  keterangan: string;
  operator: string;
  hospital: string;
  teamTs: TeamMember[];
  recipients?: string[];
};

// ✅ DIPERBAIKI: Tipe ini sekarang cocok persis dengan header di Google Sheet Anda
export type Schedule = {
  'Submission ID': number;   // Diubah dari submissionId
  'Timestamp': string;         // Diubah dari 'Tanggal Submit'
  'Tanggal Operasi': string;
  'Hospital': string;          // Diubah dari Hospital
  'Operator': string;          // Diubah dari Operator
  'Team TS': string;
  'Keterangan': string;        // Diubah dari Keterangan
};

// Tipe untuk data yang dikirim saat update
export type ScheduleUpdate = {
  submissionId: number; // Diubah dari SubmissionID agar konsisten
  tanggalOperasi: string;
  keterangan: string;
  operator: string;
  hospital: string;
  teamTs: TeamMember[];
};

// Tipe untuk respons API
export type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
};