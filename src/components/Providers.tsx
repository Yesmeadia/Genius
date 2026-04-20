"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    gsap.registerPlugin(ScrollTrigger);
    
    // Ensure GSAP ticker is synchronized with Lenis
    const update = (time: number) => {
      ScrollTrigger.update();
    };
    
    // Cleanup is handled by standard React patterns if needed, 
    // but GSAP and Lenis usually live globally.
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
