"use client";

import { useState, useRef } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LogIn, Lock, Mail, AlertCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth(false, "/admin/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!authLoading && !user && cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power3.out"
      });
    }
  }, { dependencies: [authLoading, user], scope: containerRef });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Check your credentials.");
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      {authLoading || user ? (
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <div ref={cardRef} className="w-full max-w-md">
          <Card className="login-card shadow-lg border-none">
            <CardHeader className="text-center space-y-1 pb-8">
                <div className="flex flex-col items-center gap-4 mb-4">
                    <img src="/yeslogo.png" alt="Logo" className="h-5 w-auto opacity-50" />
                    <img src="/Genius.png" alt="Logo" className="h-12 w-auto" />
                </div>
                <CardDescription className="text-slate-500">Sign in to manage registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      id="email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@geniusjam.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      id="password"
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-4 h-11 font-bold"
                >
                  {isSubmitting ? "Authenticating..." : "Sign In"}
                  {!isSubmitting && <LogIn className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <Button 
                variant="ghost"
                onClick={() => router.push("/")}
                className="w-full text-slate-400 text-sm mt-6 hover:text-slate-600 font-medium"
              >
                ← Back to Registration
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
