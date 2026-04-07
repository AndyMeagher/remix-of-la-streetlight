import { useState } from "react";
import { Home, Bed, UtensilsCrossed, Heart, ShieldAlert, Building2, MessageSquare, HandHeart, Coffee } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "shelters", label: "Shelters", icon: Bed },
  { id: "transitional", label: "AB12", icon: Building2 },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "dropin", label: "Drop-in", icon: Coffee },
  { id: "tips", label: "Tips", icon: MessageSquare },
  { id: "medical", label: "Medical", icon: Heart },
  { id: "getout", label: "Safe Choices", icon: HandHeart },
  { id: "sos", label: "SOS", icon: ShieldAlert },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
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
