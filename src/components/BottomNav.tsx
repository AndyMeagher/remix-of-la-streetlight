import { Home, Building2, Coffee, Heart, MessageSquare, ShieldAlert } from "lucide-react";
import Butterfly from "./icons/Butterfly";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "housing", label: "Housing", icon: Building2 },
  { id: "daily", label: "Drop-In", icon: Coffee },
  { id: "medical", label: "Medical", icon: Heart },
  { id: "getout", label: "Safe Choices", icon: Bug },
  { id: "tips", label: "Tips", icon: MessageSquare },
  { id: "sos", label: "SOS", icon: ShieldAlert },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isSOS = tab.id === "sos";
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isSOS
                  ? "text-destructive"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isSOS && !isActive ? "animate-pulse-glow rounded-full" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
