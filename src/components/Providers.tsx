"use client";

import { ReactLenis } from "lenis/react";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Ensure GSAP ticker is synchronized with Lenis
    const update = (time: number) => {
      ScrollTrigger.update();
    };
    
    // Cleanup is handled by standard React patterns if needed, 
    // but GSAP and Lenis usually live globally.
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
