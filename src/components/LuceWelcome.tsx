import { useState, useEffect } from "react";
import luceMascot from "@/assets/luce-mascot.png";
import { playLuceSound } from "@/hooks/useLuceSound";

const LuceWelcome = () => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("luce-welcome-seen");
    if (!seen) {
      setVisible(true);
      // Play chime when Luce appears
      const timer = setTimeout(() => playLuceSound(), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem("luce-welcome-seen", "true");
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      onClick={dismiss}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 mx-6 max-w-sm text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={luceMascot}
          alt="Luce, the LA Streetlight mascot"
          className="w-20 h-20 rounded-full mx-auto mb-4 streetlight-glow object-cover"
        />
        <h2 className="font-display text-lg text-primary mb-2">Hey, I'm Luce 💛</h2>
        <p className="text-sm text-foreground/90 leading-relaxed mb-1">
          I'm glad you're here.
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed mb-5">
          Being you is enough.
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          I'll help you find food, shelter, medical care, and more — no judgment, ever.
        </p>
        <button
          onClick={dismiss}
          className="w-full bg-primary text-primary-foreground font-medium rounded-lg py-2.5 text-sm active:opacity-90 transition-opacity"
        >
          Let's go
        </button>
      </div>
    </div>
  );
};

export default LuceWelcome;
