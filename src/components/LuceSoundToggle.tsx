import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isLuceSoundMuted, setLuceSoundMuted } from "@/hooks/useLuceSound";

const LuceSoundToggle = () => {
  const [muted, setMuted] = useState(isLuceSoundMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setLuceSoundMuted(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-xs text-muted-foreground active:text-foreground transition-colors px-3 py-2 rounded-lg"
      aria-label={muted ? "Unmute Luce sounds" : "Mute Luce sounds"}
      title={muted ? "Unmute Luce sounds" : "Mute Luce sounds"}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      <span>{muted ? "Sounds off" : "Sounds on"}</span>
    </button>
  );
};

export default LuceSoundToggle;
