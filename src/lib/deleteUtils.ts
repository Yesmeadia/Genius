import { db } from "./firebase";
import { doc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function moveToRecycleBin(
  originalId: string,
  originalCollection: string,
  data: any,
  type: string,
  deletedBy?: string
) {
  try {
    // 1. Add to recycle_bin collection
    await addDoc(collection(db, "recycle_bin"), {
      originalId,
      originalCollection,
      data,
      type,
      deletedAt: serverTimestamp(),
      deletedBy: deletedBy || "System Admin",
    });

    // 2. Delete from original collection
    await deleteDoc(doc(db, originalCollection, originalId));
    
    return { success: true };
  } catch (error) {
    console.error("Error moving to recycle bin:", error);
    throw error;
  }
}

export async function restoreFromRecycleBin(record: any) {
  try {
    const { originalId, originalCollection, data } = record;
    
    // 1. Restore to original collection
    await setDoc(doc(db, originalCollection, originalId), data);
    
    // 2. Delete from recycle bin
    await deleteDoc(doc(db, "recycle_bin", record.id));
    
    return { success: true };
  } catch (error) {
    console.error("Error restoring record:", error);
    throw error;
  }
}

export async function permanentDelete(recordId: string) {
  try {
    await deleteDoc(doc(db, "recycle_bin", recordId));
    return { success: true };
  } catch (error) {
    console.error("Error permanently deleting record:", error);
    throw error;
  }
}
