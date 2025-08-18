"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CORRECT_PIN = "1234"; // bisa ganti / ambil dari .env

export default function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleVerify = () => {
    if (pin === CORRECT_PIN) {
      setError("");
      setPin("");
      onSuccess();
      onClose();
    } else {
      setError("PIN salah, coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg w-80"
      >
        <h2 className="text-lg font-semibold mb-4 text-center">Masukkan PIN</h2>
        <Input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="mb-2"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleVerify}>Verifikasi</Button>
        </div>
      </motion.div>
    </div>
  );
}
