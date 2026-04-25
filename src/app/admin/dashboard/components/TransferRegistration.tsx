"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  RegistrationType, 
  REGISTRATION_TYPES, 
  transferRegistration 
} from "@/lib/transferUtils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRightLeft, Loader2, AlertTriangle } from "lucide-react";

interface TransferRegistrationProps {
  sourceId: string;
  sourceType: RegistrationType;
  currentData: any;
  onTransferStart?: () => void;
}

export function TransferRegistration({ 
  sourceId, 
  sourceType, 
  currentData,
  onTransferStart 
}: TransferRegistrationProps) {
  const [targetType, setTargetType] = useState<RegistrationType | "">("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleTransfer = async () => {
    if (!targetType || targetType === sourceType) return;

    if (onTransferStart) onTransferStart();
    setIsTransferring(true);
    try {
      const result = await transferRegistration(sourceId, sourceType, targetType as RegistrationType, currentData);
      if (result) {
        setOpen(false);
        router.push(result.targetPath);
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Failed to transfer record. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  const sourceConfig = REGISTRATION_TYPES.find(t => t.id === sourceType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-slate-200 text-slate-600 font-normal uppercase text-[10px] tracking-widest hover:bg-slate-50"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            Transfer Registration
          </DialogTitle>
          <DialogDescription>
            Move this record from <strong>{sourceConfig?.label}</strong> to another category.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Target Category</label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as RegistrationType)}>
              <SelectTrigger className="w-full h-12 rounded-xl">
                <SelectValue placeholder="Choose category..." />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_TYPES.filter(t => t.id !== sourceType).map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              Data will be moved to the new collection. Some fields specific to the current category might be lost or converted. This action cannot be easily undone.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isTransferring}
            className="rounded-xl font-bold text-[10px] uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetType || isTransferring}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
          >
            {isTransferring ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</>
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
