import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bed, UtensilsCrossed, Heart, Search, Building2, HandHeart, Navigation, Loader2, Coffee, Map, ShieldCheck, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import luceMascot from "@/assets/luce-mascot.png";
import BottomNav from "../components/BottomNav";
import QuickExit from "../components/QuickExit";
import ResourceCard from "../components/ResourceCard";
import SOSPanel from "../components/SOSPanel";
import StreetTips from "../components/StreetTips";
import NearMeNow from "../components/NearMeNow";
import PeerSupport from "../components/PeerSupport";
import LightJourney from "../components/LightJourney";
import DocumentVault from "../components/DocumentVault";
import LuceWelcome from "../components/LuceWelcome";
import LuceNotificationPrompt from "../components/LuceNotificationPrompt";
import LuceSoundToggle from "../components/LuceSoundToggle";
import LightPointsBadge from "../components/LightPointsBadge";
import StreakBanner from "../components/StreakBanner";
import FloatingStats from "../components/FloatingStats";
import { useResources } from "../hooks/useResources";
import { awardDailyOpenIfNeeded, processReferralIfPresent } from "../hooks/useLightPoints";
import { bumpStreak } from "../hooks/useStreak";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [subTab, setSubTab] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { loading, shelterResources, foodResources, medicalResources, transitionalResources, traffickingResources, dropinResources, resources } = useResources();

  useEffect(() => {
    processReferralIfPresent().finally(() => {
      awardDailyOpenIfNeeded();
      bumpStreak();
    });
  }, []);

  const goTo = (tab: string, sub?: string) => {
    setActiveTab(tab);
    setSubTab(sub);
  };

  const quickActions = [
    { id: "housing", sub: "shelters", label: "Shelters", icon: Bed, count: shelterResources.filter(r => r.isOpen).length },
    { id: "daily", sub: "food", label: "Food", icon: UtensilsCrossed, count: foodResources.filter(r => r.isOpen).length },
    { id: "daily", sub: "dropin", label: "Drop-in", icon: Coffee, count: dropinResources.filter(r => r.isOpen).length },
    { id: "health", sub: "medical", label: "Medical", icon: Heart, count: medicalResources.filter(r => r.isOpen).length },
  ];

  const resourceMap: Record<string, { data: typeof shelterResources; icon: typeof Bed; title: string; description?: string }> = {
    shelters: { data: shelterResources, icon: Bed, title: "Shelters & Housing" },
    transitional: { data: transitionalResources, icon: Building2, title: "AB12 Transitional Housing", description: "Resources for Transitional Age Youth (18–24) eligible for AB12 extended foster care funding, THP-Plus, and ILP services." },
    food: { data: foodResources, icon: UtensilsCrossed, title: "Food & Meals" },
    dropin: { data: dropinResources, icon: Coffee, title: "Drop-in Services", description: "Walk-in centers offering showers, laundry, mail services, case management, and other daytime support — no appointment needed." },
    medical: { data: medicalResources, icon: Heart, title: "Medical Care" },
    getout: { data: traffickingResources, icon: HandHeart, title: "Safe Choices", description: "Confidential help for youth and young adults who may be victims of human trafficking. These organizations provide safe shelter, crisis support, legal aid, and a way out — no judgment, no questions." },
  };

  const groupMap: Record<string, { title: string; tabs: { id: string; label: string }[] }> = {
    housing: { title: "Housing", tabs: [{ id: "shelters", label: "Shelters" }, { id: "transitional", label: "AB12" }] },
    daily: { title: "Food & Drop-in", tabs: [{ id: "food", label: "Meals" }, { id: "dropin", label: "Drop-in" }] },
  };


  const renderHome = () => (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <img src={luceMascot} alt="Luce, the LA Streetlight mascot" className="w-12 h-12 rounded-full streetlight-glow object-cover" />
        <div className="flex-1">
          <h1 className="font-display text-lg text-foreground leading-tight">LA Streetlight</h1>
          <p className="text-xs text-muted-foreground">Find support near you</p>
        </div>
        <LightPointsBadge />
        <LuceSoundToggle />
      </div>

      <StreakBanner />

      {/* Near Me Now Button */}
      <button
        onClick={() => setActiveTab("nearme")}
        className="w-full mb-6 bg-primary text-primary-foreground rounded-xl p-4 flex items-center gap-3 active:opacity-80 transition-opacity shadow-lg"
      >
        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Navigation className="w-6 h-6" />
        </div>
        <div className="text-left flex-1">
          <span className="text-base font-display font-semibold block">Near Me Now</span>
          <span className="text-xs opacity-80">Find closest resources using your location</span>
        </div>
      </button>

      {/* Light Journey + Vault entry cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setActiveTab("journey")}
          className="bg-card border border-border rounded-xl p-4 text-left active:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <Map className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-sm text-foreground">Light Journey</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Your road to independence</p>
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          className="bg-card border border-border rounded-xl p-4 text-left active:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <p className="font-display text-sm text-foreground">Document Vault</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">PIN-protected & private</p>
        </button>
      </div>

      {/* Peer to Peer Support entry */}
      <button
        onClick={() => setActiveTab("peer")}
        className="w-full mb-6 bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:bg-secondary transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm text-foreground">Peer to Peer Support</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Free drop-in groups · Powered by Share Help LA</p>
        </div>
      </button>


      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {quickActions.map((action) => (
          <button
            key={`${action.id}-${action.sub}`}
            onClick={() => goTo(action.id, action.sub)}
            className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 active:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <action.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
            <span className="text-[10px] text-safe">{action.count} open</span>
          </button>
        ))}
      </div>

      {/* Nearby Open / Search Results */}
      {searchQuery.trim() ? (
        <>
          <h2 className="font-display text-base text-foreground mb-3">Search Results</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (() => {
            const q = searchQuery.toLowerCase();
            const results = [...shelterResources, ...transitionalResources, ...foodResources, ...dropinResources, ...medicalResources, ...traffickingResources]
              .filter((r) => r.name.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q)));
            return results.length > 0 ? (
              <div className="space-y-2">
                {results.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No resources found for "{searchQuery}"</p>
            );
          })()}
        </>
      ) : (
        <>
          <h2 className="font-display text-base text-foreground mb-3">Open Now Nearby</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {[...shelterResources, ...transitionalResources, ...foodResources, ...dropinResources, ...medicalResources]
                .filter((r) => r.isOpen)
                .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
                .slice(0, 4)
                .map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderGroup = (groupId: string) => {
    const group = groupMap[groupId];
    if (!group) return null;
    const defaultSub = group.tabs[0].id;
    const value = subTab && group.tabs.some((t) => t.id === subTab) ? subTab : defaultSub;
    return (
      <div className="px-4 pt-6 pb-24">
        <h2 className="font-display text-xl text-foreground mb-4">{group.title}</h2>
        <Tabs value={value} onValueChange={setSubTab} className="w-full">
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${group.tabs.length}, 1fr)` }}>
            {group.tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {group.tabs.map((t) => {
            const config = resourceMap[t.id];
            if (!config) return null;
            return (
              <TabsContent key={t.id} value={t.id} className="mt-4">
                {config.description && (
                  <p className="text-xs text-primary/80 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mb-4">
                    {config.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-4">
                  {config.data.filter((r) => r.isOpen).length} of {config.data.length} open now
                </p>
                <div className="space-y-2">
                  {config.data.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} icon={config.icon} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <LuceWelcome />
      <QuickExit />
      <LuceNotificationPrompt />
      <FloatingStats />
      {activeTab === "home" && renderHome()}
      {activeTab === "nearme" && <NearMeNow />}
      {activeTab === "journey" && <LightJourney />}
      {activeTab === "vault" && <DocumentVault />}
      {activeTab === "sos" && <SOSPanel />}
      {activeTab === "tips" && <StreetTips />}
      {activeTab === "peer" && <PeerSupport />}
      {["housing", "daily"].includes(activeTab) && renderGroup(activeTab)}
      {["medical", "getout"].includes(activeTab) && (() => {
        const config = resourceMap[activeTab];
        if (!config) return null;
        return (
          <div className="px-4 pt-6 pb-24">
            <h2 className="font-display text-xl text-foreground mb-4">{config.title}</h2>
            {config.description && (
              <p className="text-xs text-primary/80 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mb-4">
                {config.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              {config.data.filter((r) => r.isOpen).length} of {config.data.length} open now
            </p>
            <div className="space-y-2">
              {config.data.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} icon={config.icon} />
              ))}
            </div>
          </div>
        );
      })()}
      <footer className="px-4 pb-20 pt-4 text-center text-xs text-muted-foreground flex justify-center gap-4">
        <Link to="/privacy" className="hover:text-primary underline">Privacy Policy</Link>
        <Link to="/support" className="hover:text-primary underline">Support</Link>
      </footer>
      <BottomNav activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setSubTab(undefined); }} />
    </div>
  );
};

export default Index;
