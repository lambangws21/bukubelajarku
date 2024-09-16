// components/EditDialog.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type SheetDataItem = {
  id: number;
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

interface EditDialogProps {
  item: SheetDataItem | null;
  onClose: () => void;
  onSave: (item: SheetDataItem) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ item, onClose, onSave }) => {
  const [editItem, setEditItem] = useState<SheetDataItem | null>(item);

  const handleChange = (field: keyof SheetDataItem, value: string | number) => {
    if (editItem) {
      setEditItem({ ...editItem, [field]: value });
    }
  };

  const handleSave = () => {
    if (editItem) {
      onSave(editItem);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Edit Data</DialogTitle>
        <DialogDescription>Perbarui informasi data operasi.</DialogDescription>
        <div className="space-y-2">
          <Input
            type="date"
            value={editItem?.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
          />
          <Input
            type="text"
            value={editItem?.rumahSakit || ""}
            onChange={(e) => handleChange("rumahSakit", e.target.value)}
          />
          <Input
            type="text"
            value={editItem?.operasi || ""}
            onChange={(e) => handleChange("operasi", e.target.value)}
          />
          <Input
            type="text"
            value={editItem?.operator || ""}
            onChange={(e) => handleChange("operator", e.target.value)}
          />
          <Input
            type="number"
            value={editItem?.jumlah.toString() || ""}
            onChange={(e) => handleChange("jumlah", parseInt(e.target.value))}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;
