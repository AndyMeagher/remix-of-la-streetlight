import { useState, useEffect } from "react";
import { ThumbsUp, Send, MessageSquare, Flag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const categories = ["general", "safety", "food", "shelter", "health", "legal"];

const StreetTips = () => {
  const [newTip, setNewTip] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCat, setFilterCat] = useState("all");
  const queryClient = useQueryClient();

  const getDeviceId = () => {
    let id = localStorage.getItem("luce_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("luce_device_id", id);
    }
    return id;
  };

  const { data: reports = [] } = useQuery({
    queryKey: ["tip_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tip_reports")
        .select("tip_id, device_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["street_tips", filterCat],
    queryFn: async () => {
      let query = supabase
        .from("street_tips")
        .select("*")
        .order("created_at", { ascending: false });
      if (filterCat !== "all") {
        query = query.eq("category", filterCat);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Filter out tips with 3+ unique reports
  const reportCounts: Record<string, number> = {};
  const myReports = new Set<string>();
  const deviceId = getDeviceId();
  reports.forEach((r) => {
    reportCounts[r.tip_id] = (reportCounts[r.tip_id] || 0) + 1;
    if (r.device_id === deviceId) myReports.add(r.tip_id);
  });
  const visibleTips = tips.filter((t) => (reportCounts[t.id] || 0) < 3);

  const reportTip = useMutation({
    mutationFn: async (tipId: string) => {
      const { error } = await supabase
        .from("tip_reports")
        .insert({ tip_id: tipId, device_id: getDeviceId() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tip_reports"] });
    },
  });

  const addTip = useMutation({
    mutationFn: async () => {
      const trimmed = newTip.trim();
      if (!trimmed || trimmed.length < 5) throw new Error("Too short");
      const { error } = await supabase
        .from("street_tips")
        .insert({ content: trimmed.slice(0, 500), category });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTip("");
      queryClient.invalidateQueries({ queryKey: ["street_tips"] });
    },
  });

  const upvote = useMutation({
    mutationFn: async (tipId: string) => {
      const { error } = await supabase.rpc("upvote_tip", { tip_id: tipId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["street_tips"] });
    },
  });

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl text-foreground">Street Tips</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Share what you've learned anonymously. No login needed.
      </p>

      {/* Add tip form */}
      <div className="bg-card border border-border rounded-xl p-3 mb-5">
        <textarea
          value={newTip}
          onChange={(e) => setNewTip(e.target.value)}
          placeholder="Share a tip that could help someone..."
          maxLength={500}
          rows={3}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors capitalize ${
                  category === cat
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => addTip.mutate()}
            disabled={newTip.trim().length < 5 || addTip.isPending}
            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-opacity"
          >
            <Send className="w-3 h-3" />
            Post
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {newTip.length}/500
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["all", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors capitalize ${
              filterCat === cat
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-secondary border-border text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tips list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Loading tips...
        </div>
      ) : visibleTips.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No tips yet. Be the first to share!
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTips.map((tip) => (
            <div key={tip.id} className="card-resource">
              <p className="text-sm text-foreground mb-2">{tip.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                  {tip.category}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => reportTip.mutate(tip.id)}
                    disabled={myReports.has(tip.id) || reportTip.isPending}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    title={
                      myReports.has(tip.id)
                        ? "Already reported"
                        : "Report as inappropriate"
                    }
                  >
                    <Flag className="w-3 h-3" />
                    {myReports.has(tip.id) ? "Reported" : "Report"}
                  </button>
                  <button
                    onClick={() => upvote.mutate(tip.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{tip.upvotes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreetTips;
