// src/components/hooks/use-toast.tsx

import { Toast, ToastProvider, useToaster } from "react-hot-toast";

// Buat fungsi toast untuk digunakan di seluruh proyek
export function toast({ title, description }: { title: string; description: JSX.Element }) {
  const { show } = useToaster();
  show((t) => (
    <Toast {...t}>
      <div className="flex flex-col space-y-1">
        <p className="font-bold">{title}</p>
        {description}
      </div>
    </Toast>
  ));
}

// Gunakan ToastProvider di aplikasi Anda untuk memastikan toast dapat digunakan
export function ToastContainer() {
  return <ToastProvider />;
}
