"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { DeletedRecord } from "../types";
import { Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import RecycleBinDataTable from "../components/RecycleBinDataTable";

export default function RecycleBinPage() {
  const { user, loading: authLoading } = useAuth(true);
  const router = useRouter();
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "recycle_bin"), orderBy("deletedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeletedRecord[];
      
      setDeletedRecords(records);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recycle bin:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-normal text-slate-900 tracking-tight flex items-center gap-3">
            <Trash2 className="text-red-500" size={32} />
            Recycle Bin
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-normal uppercase tracking-widest">
            Manage deleted records and restoration
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="h-11 px-6 rounded-2xl border-slate-200 text-slate-600 font-normal hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Go Back
        </Button>
      </div>

      <RecycleBinDataTable 
        data={deletedRecords} 
        onActionComplete={() => {}} 
      />
    </div>
  );
}
