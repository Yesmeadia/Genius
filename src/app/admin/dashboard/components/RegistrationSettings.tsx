"use client";

import { useState } from "react";
import { useFormSettings, FormSetting } from "@/hooks/useFormSettings";
import { Switch } from "@/components/ui/switch";
import { Settings, ChevronUp, ChevronDown, Save, CheckCircle2, GripVertical } from "lucide-react";

export default function RegistrationSettings() {
  const { forms, loading, saveSettings } = useFormSettings();
  const [localForms, setLocalForms] = useState<FormSetting[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Use local draft if editing, otherwise use live data sorted by order
  const displayForms = (localForms ?? forms).slice().sort((a, b) => a.order - b.order);

  const ensureLocal = () => {
    if (!localForms) setLocalForms(forms.slice().sort((a, b) => a.order - b.order));
  };

  const toggle = (id: string) => {
    ensureLocal();
    setLocalForms(prev =>
      (prev ?? forms).map(f => f.id === id ? { ...f, enabled: !f.enabled } : f)
    );
    setSaved(false);
  };

  const move = (index: number, direction: "up" | "down") => {
    ensureLocal();
    setLocalForms(prev => {
      const arr = (prev ?? forms).slice().sort((a, b) => a.order - b.order);
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      // Swap orders
      const newArr = arr.map((f, i) => {
        if (i === index) return { ...f, order: arr[swapIdx].order };
        if (i === swapIdx) return { ...f, order: arr[index].order };
        return f;
      });
      return newArr;
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

  const isDirty = localForms !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Settings size={22} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Settings</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Control which forms appear on the public home page and their display order.
          </p>
        </div>
      </div>

      {/* Form Cards */}
      <div className="space-y-3 mb-8">
        {displayForms.map((form, index) => (
          <div
            key={form.id}
            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 ${
              form.enabled
                ? "bg-white border-slate-100 shadow-sm"
                : "bg-slate-50/60 border-slate-100/50 opacity-60"
            }`}
          >
            {/* Drag handle visual */}
            <div className="text-slate-300">
              <GripVertical size={18} />
            </div>

            {/* Label */}
            <div className="flex-grow">
              <p className={`text-sm font-bold tracking-tight ${form.enabled ? "text-slate-900" : "text-slate-400"}`}>
                {form.label}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                {form.enabled ? "Visible on home page" : "Hidden from public"}
              </p>
            </div>

            {/* Up/Down arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(index, "up")}
                disabled={index === 0}
                className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => move(index, "down")}
                disabled={index === displayForms.length - 1}
                className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Toggle */}
            <Switch
              checked={form.enabled}
              onCheckedChange={() => toggle(form.id)}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-200 ${
            isDirty && !saving
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold animate-in fade-in">
            <CheckCircle2 size={16} />
            Saved successfully!
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <p className="text-xs font-medium text-amber-700 leading-relaxed">
          <strong>Note:</strong> Disabling a form hides it from the home page and blocks direct registration access. 
          Changes are reflected instantly for all users.
        </p>
      </div>
    </div>
  );
}
