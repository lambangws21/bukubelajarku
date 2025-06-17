import FormAdvanceModal from '@/components/Dasboards/DasboardAdvance/FormAdvance';
import FormBiayaModal from '@/components/Dasboards/DasboardAdvance/FormBiaya';
import { ToastContainer } from 'react-toastify';

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <FormAdvanceModal />
      <FormBiayaModal />
      <ToastContainer position="top-right" autoClose={3000} />
    </main>
  );
}
