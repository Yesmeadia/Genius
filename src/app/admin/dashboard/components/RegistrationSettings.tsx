"use client";

import { useState } from "react";
import { useFormSettings, FormSetting } from "@/hooks/useFormSettings";
import { Switch } from "@/components/ui/switch";
import {
  ChevronUp,
  ChevronDown,
  Save,
  CheckCircle2,
  GripVertical,
  SlidersHorizontal,
} from "lucide-react";

export default function RegistrationSettings() {
  const { forms, loading, saveSettings } = useFormSettings();
  const [localForms, setLocalForms] = useState<FormSetting[] | null>(null);
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  const displayForms = (localForms ?? forms).slice().sort((a, b) => a.order - b.order);
  const isDirty = localForms !== null;

  const ensureLocal = () => {
    if (!localForms) setLocalForms(forms.slice().sort((a, b) => a.order - b.order));
  };

  const toggle = (id: string) => {
    ensureLocal();
    setLocalForms(prev => (prev ?? forms).map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    setSaved(false);
  };

  const move = (index: number, direction: "up" | "down") => {
    ensureLocal();
    setLocalForms(prev => {
      const arr = (prev ?? forms).slice().sort((a, b) => a.order - b.order);
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      return arr.map((f, i) => {
        if (i === index) return { ...f, order: arr[swapIdx].order };
        if (i === swapIdx) return { ...f, order: arr[index].order };
        return f;
      });
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!localForms) return;
    setSaving(true);
    await saveSettings(localForms);
    setSaving(false);
    setSaved(true);
    setLocalForms(null);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Forms</h2>
            <p className="text-xs text-slate-400 mt-0.5">Toggle and reorder forms shown to the public.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold animate-in fade-in">
              <CheckCircle2 size={13} /> Saved
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              isDirty && !saving
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {saving
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={13} />
            }
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Form rows */}
      <div className="space-y-2">
        {displayForms.map((form, index) => (
          <div
            key={form.id}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
              form.enabled
                ? "bg-white border-slate-100 shadow-sm"
                : "bg-slate-50/60 border-slate-100/50 opacity-50"
            }`}
          >
            <GripVertical size={16} className="text-slate-300 flex-shrink-0" />

            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${form.enabled ? "bg-emerald-400" : "bg-slate-300"}`} />

            <div className="flex-grow min-w-0">
              <p className={`text-sm font-bold ${form.enabled ? "text-slate-900" : "text-slate-400"}`}>
                {form.label}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                {form.enabled ? "Visible on home page" : "Hidden from public"}
              </p>
            </div>

            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => move(index, "up")}
                disabled={index === 0}
                className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={15} />
              </button>
              <button
                onClick={() => move(index, "down")}
                disabled={index === displayForms.length - 1}
                className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={15} />
              </button>
            </div>

            <Switch
              checked={form.enabled}
              onCheckedChange={() => toggle(form.id)}
              className="data-[state=checked]:bg-indigo-600 flex-shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
