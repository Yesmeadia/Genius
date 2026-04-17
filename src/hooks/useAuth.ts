"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function useAuth(requireAuth: boolean = true, redirectToIfFound?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (requireAuth && !user) {
        router.push("/admin/login");
      }

      if (user && redirectToIfFound) {
        router.push(redirectToIfFound);
      }
    });

    return () => unsubscribe();
  }, [requireAuth, router, redirectToIfFound]);

  return { user, loading };
}
