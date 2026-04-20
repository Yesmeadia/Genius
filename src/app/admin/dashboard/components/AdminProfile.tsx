"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  BadgeCheck,
  KeyRound,
  Fingerprint,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Section = "account" | "security" | "session";

const navItems: { id: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "account",  label: "Account Info",  icon: <User size={16} />,        desc: "Name & email details" },
  { id: "security", label: "Security",      icon: <KeyRound size={16} />,    desc: "Password management" },
  { id: "session",  label: "Session",       icon: <Fingerprint size={16} />, desc: "Login & provider info" },
];

export default function AdminProfile() {
  const { user } = useAuth(true);
  const [activeSection, setActiveSection] = useState<Section>("account");

  // Best-effort name
  const resolvedName =
    user?.displayName ||
    user?.providerData?.[0]?.displayName ||
    user?.email?.split("@")[0] ||
    "Administrator";

  // Auto-sync display name into Firebase if missing
  useEffect(() => {
    if (user && !user.displayName) {
      const fallback =
        user.providerData?.[0]?.displayName || user.email?.split("@")[0];
      if (fallback) updateProfile(user, { displayName: fallback }).catch(() => {});
    }
  }, [user]);

  const initials = resolvedName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Account section state ──
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openEditName = () => {
    setDisplayName(resolvedName === "Administrator" ? "" : resolvedName);
    setEditingName(true);
    setNameMsg(null);
  };
  const cancelEditName = () => { setEditingName(false); setNameMsg(null); };
  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    setNameLoading(true); setNameMsg(null);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setNameMsg({ type: "success", text: "Display name updated." });
      setEditingName(false);
    } catch (err: any) {
      setNameMsg({ type: "error", text: err?.message || "Failed to update." });
    } finally { setNameLoading(false); }
  };

  // ── Security section state ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async () => {
    if (!user?.email) return;
    if (!currentPw || !newPw || !confirmPw) { setPwMsg({ type: "error", text: "Fill in all fields." }); return; }
    if (newPw !== confirmPw)                { setPwMsg({ type: "error", text: "Passwords do not match." }); return; }
    if (newPw.length < 8)                  { setPwMsg({ type: "error", text: "Minimum 8 characters." }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPasswordForm(false);
    } catch (err: any) {
      setPwMsg({ type: "error", text: err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential" ? "Current password is incorrect." : (err?.message || "Failed.") });
    } finally { setPwLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

          {/* Avatar card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* gradient strip */}
            <div className="h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent)]" />
            </div>
            {/* avatar */}
            <div className="px-6 pb-6 -mt-10">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-2 ring-slate-100">
                <AvatarImage src={user.photoURL ?? "/geniuseicon.png"} />
                <AvatarFallback className="bg-indigo-600 text-white text-xl font-black">{initials}</AvatarFallback>
              </Avatar>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-slate-900 truncate">{resolvedName}</h2>
                  <BadgeCheck size={15} className="text-indigo-500 flex-shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                  <Shield size={10} />
                  Super Admin
                </div>
              </div>
            </div>
          </div>

          {/* Vertical nav */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-indigo-50"
                  }`}>
                    <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500"}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-[13px] font-bold leading-none ${isActive ? "text-white" : ""}`}>{item.label}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className={`ml-auto flex-shrink-0 transition-transform ${isActive ? "text-white" : "text-slate-300"} ${isActive ? "translate-x-0" : ""}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className="flex-1 min-w-0">

          {/* ── Account Info ── */}
          {activeSection === "account" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Account Information</h3>
                <p className="text-xs text-slate-400 mt-1">Manage your public profile details.</p>
              </div>

              <div className="space-y-4">
                {/* Display name */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Display Name</label>
                    {!editingName ? (
                      <button onClick={openEditName} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold">
                        <Edit3 size={12} /> Edit
                      </button>
                    ) : (
                      <button onClick={cancelEditName} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-bold">
                        <X size={12} /> Cancel
                      </button>
                    )}
                  </div>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveName()}
                        placeholder="Enter display name…"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={saveName}
                        disabled={nameLoading || !displayName.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200"
                      >
                        {nameLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm font-bold text-slate-900">{resolvedName}</span>
                    </div>
                  )}
                  {nameMsg && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${nameMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                      {nameMsg.type === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {nameMsg.text}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-50" />

                {/* Email */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Mail size={15} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-900 flex-1 truncate">{user.email}</span>
                    {user.emailVerified && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* UID */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Account UID</label>
                  <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-mono text-slate-500 break-all">{user.uid}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeSection === "security" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Security</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage your login credentials.</p>
                </div>
                <button
                  onClick={() => { setShowPasswordForm((p) => !p); setPwMsg(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    showPasswordForm ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  <Lock size={13} />
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </button>
              </div>

              {!showPasswordForm ? (
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Password</p>
                    <p className="text-xs text-slate-400 mt-0.5">Last changed: unknown — click to update</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {[
                    { label: "Current Password", value: currentPw, setter: setCurrentPw, show: showCur, toggle: () => setShowCur(p => !p) },
                    { label: "New Password",     value: newPw,     setter: setNewPw,     show: showNew, toggle: () => setShowNew(p => !p) },
                    { label: "Confirm Password", value: confirmPw, setter: setConfirmPw, show: showCon, toggle: () => setShowCon(p => !p), onEnter: handlePasswordChange },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.show ? "text" : "password"}
                          value={field.value}
                          onChange={(e) => field.setter(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && field.onEnter?.()}
                          className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                        />
                        <button onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {pwMsg && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${pwMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                      {pwMsg.type === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {pwMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handlePasswordChange}
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 disabled:opacity-50 transition-all shadow-md shadow-rose-200"
                  >
                    {pwLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
                    Update Password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Session ── */}
          {activeSection === "session" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Session Details</h3>
                <p className="text-xs text-slate-400 mt-1">Information about your current login session.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: <Clock size={16} className="text-indigo-500" />,
                    bg: "bg-indigo-50",
                    label: "Last Sign-in",
                    value: user.metadata.lastSignInTime
                      ? new Date(user.metadata.lastSignInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "—",
                  },
                  {
                    icon: <CheckCircle2 size={16} className="text-emerald-500" />,
                    bg: "bg-emerald-50",
                    label: "Account Created",
                    value: user.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", { dateStyle: "long" })
                      : "—",
                  },
                  {
                    icon: <Shield size={16} className="text-violet-500" />,
                    bg: "bg-violet-50",
                    label: "Auth Provider",
                    value: user.providerData[0]?.providerId?.replace(".com", "") || "password",
                  },
                  {
                    icon: <BadgeCheck size={16} className="text-amber-500" />,
                    bg: "bg-amber-50",
                    label: "Email Verification",
                    value: user.emailVerified ? "Verified ✓" : "Not verified",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className={`w-9 h-9 rounded-xl ${row.bg} flex items-center justify-center flex-shrink-0`}>
                      {row.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.label}</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{row.value}</p>
                    </div>
                  </div>
                ))}

                {/* UID */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account UID</p>
                  <p className="text-xs font-mono text-slate-500 break-all">{user.uid}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
