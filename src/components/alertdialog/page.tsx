import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AlertDialog = ({ message }: { message: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hidden">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Notification</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
        <Button onClick={() => setOpen(false)}>OK</Button>
      </DialogContent>
    </Dialog>
  );
};
 