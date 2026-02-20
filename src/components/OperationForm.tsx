"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInputOperasi from "@/components/Dasboards/DasboardAsistensi/FormInput";

export default function OperationForm({
  onFormSubmit,
}: {
  onFormSubmit: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Tambah Operasi
      </Button>
      <FormInputOperasi
        visible={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          void onFormSubmit();
        }}
        initialData={null}
      />
    </>
  );
}

