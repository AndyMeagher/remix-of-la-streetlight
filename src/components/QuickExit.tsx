import { X } from "lucide-react";
import { useState } from "react";

const QuickExit = () => {
  const [exited, setExited] = useState(false);

  if (exited) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => setExited(false)}
      >
        <div className="text-6xl mb-4">🌤️</div>
        <p className="text-[#e0e0e0] text-2xl font-body">72°F</p>
        <p className="text-[#a0a0a0] text-sm mt-1">Los Angeles, CA</p>
        <p className="text-[#a0a0a0] text-xs mt-6">Tap anywhere to return</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExited(true)}
      className="fixed top-4 right-4 z-50 bg-secondary border border-border rounded-full p-2 transition-colors active:bg-muted"
      aria-label="Quick exit"
    >
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  );
};

export default QuickExit;
