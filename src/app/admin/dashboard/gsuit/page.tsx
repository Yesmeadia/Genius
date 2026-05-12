"use client";

import { useState, useMemo, useRef } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { generateGSuitPassPDF, generateBatchGSuitPasses } from "@/lib/gsuitExportUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bed, 
  Download, 
  Printer, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  RefreshCcw,
  Sparkles,
  MessageCircle,
  UserCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function GSuitPage() {
  const { guestRegistrations, loading } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    room: "",
    hostName: "",
    hostPhone: "",
    hostWhatsapp: ""
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredGuests = useMemo(() => {
    return guestRegistrations.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.whatsappNumber.includes(searchTerm) ||
      (g.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.room || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [guestRegistrations, searchTerm]);

  useGSAP(() => {
    gsap.from(".gsuit-card", {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      ease: "power4.out"
    });
  }, { scope: containerRef });

  const handleOpenEdit = (guest: any) => {
    setSelectedGuest(guest);
    setFormData({
      room: guest.room || "",
      hostName: guest.hostName || "Mr. Fazlurahman",
      hostPhone: guest.hostPhone || "+91 90000 00000",
      hostWhatsapp: guest.hostWhatsapp || "919000000000"
    });
  };

  const handleUpdateAccommodation = async () => {
    if (!selectedGuest) return;
    setIsUpdating(true);
    try {
      const guestRef = doc(db, "guest_registrations", selectedGuest.id);
      await updateDoc(guestRef, {
        ...formData
      });
      setSelectedGuest(null);
    } catch (error) {
      console.error("Error updating accommodation:", error);
      alert("Failed to update accommodation details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIssuePass = async (guest: any) => {
    await generateGSuitPassPDF(guest);
  };

  const handleIssueAll = async () => {
    if (filteredGuests.length === 0) return;
    await generateBatchGSuitPasses(filteredGuests);
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* HEADER SECTION */}
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 gsuit-card bg-white p-8 rounded-[32px] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">GSuit (Guest Rooms)</h1>
          <p className="text-slate-500 font-medium">Total {guestRegistrations.length} guest records found</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search guests, phone or room..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all font-medium"
            />
          </div>
          <Button 
            onClick={handleIssueAll}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer size={18} className="mr-2" /> Issue All
          </Button>
        </div>
      </div>

      {/* GUEST LIST */}
      <div className="space-y-4 gsuit-card">
        {/* Table Header (Hidden on small screens) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="col-span-3">Guest Details</div>
          <div className="col-span-3">Address</div>
          <div className="col-span-3">Accommodation</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-[32px] shadow-sm">
            <RefreshCcw className="mx-auto animate-spin text-emerald-500" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Guest Records...</p>
          </div>
        ) : filteredGuests.length > 0 ? (
          filteredGuests.map(guest => (
            <div key={guest.id} className="bg-white rounded-[24px] shadow-xl shadow-slate-100/50 border border-slate-50 overflow-hidden hover:border-emerald-100 transition-all group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 lg:p-4">
                
                {/* Guest Profile */}
                <div className="lg:col-span-3 min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate">{guest.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                      <Phone size={10} />
                      <span className="text-[10px] font-mono">{guest.whatsappNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="lg:col-span-3">
                  <div className="flex gap-2">
                    <MapPin className="text-slate-300 shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">
                      {guest.address || "No address provided"}
                    </p>
                  </div>
                </div>

                {/* Accommodation info */}
                <div className="lg:col-span-3">
                  <div 
                    onClick={() => handleOpenEdit(guest)}
                    className={`flex flex-col gap-1 p-2 rounded-xl cursor-pointer transition-all border ${guest.room ? 'bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50' : 'bg-slate-50/50 border-slate-100/50 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Bed size={14} className={guest.room ? "text-emerald-600" : "text-slate-400"} />
                      <span className={`text-xs font-black ${guest.room ? "text-emerald-700" : "text-slate-400 italic"}`}>
                        {guest.room || "Assign Room"}
                      </span>
                    </div>
                    {guest.hostName && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 pl-5">
                        <UserCheck size={10} />
                        <span>{guest.hostName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-3 flex items-center justify-end gap-2">
                  <Button 
                    onClick={() => handleIssuePass(guest)}
                    variant="ghost"
                    className="h-9 px-4 rounded-xl text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[9px] tracking-widest"
                  >
                    <Download size={14} className="mr-2" /> Pass
                  </Button>
                  <Button 
                    onClick={() => handleOpenEdit(guest)}
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:bg-slate-50"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-[40px] shadow-sm border border-slate-50">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Guests Found</h3>
            <p className="text-slate-400 mt-2">Adjust your search to find guest records.</p>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden font-figtree">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
                <Bed size={24} />
              </div>
              <DialogTitle className="text-2xl font-black">Accommodation Details</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium pt-1">
                Set up stay details for {selectedGuest?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Hotel / Room Name</label>
                <div className="relative">
                  <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="e.g. Hotel Kashmiri Flower - Room 302" 
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    className="pl-12 h-12 bg-slate-50 border-none rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Host Name</label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="Enter host name" 
                    value={formData.hostName}
                    onChange={(e) => setFormData({...formData, hostName: e.target.value})}
                    className="pl-12 h-12 bg-slate-50 border-none rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Host Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <Input 
                      placeholder="+91..." 
                      value={formData.hostPhone}
                      onChange={(e) => setFormData({...formData, hostPhone: e.target.value})}
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Host WhatsApp</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <Input 
                      placeholder="91..." 
                      value={formData.hostWhatsapp}
                      onChange={(e) => setFormData({...formData, hostWhatsapp: e.target.value})}
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedGuest(null)}
                className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateAccommodation}
                disabled={isUpdating}
                className="h-12 px-8 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-100"
              >
                {isUpdating ? <RefreshCcw size={18} className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                Save Details
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
