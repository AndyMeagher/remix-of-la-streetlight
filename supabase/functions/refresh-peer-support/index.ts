// Refresh SHARE! peer-to-peer schedule via Firecrawl + Lovable AI.
// Scrapes both DTLA and Culver City pages, parses with AI into structured rows,
// upserts into peer_support_groups, and deactivates meetings that vanished.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOURCES = [
  { location: "dtla", label: "Downtown LA", url: "https://www.shareselfhelp.org/dtlameetings" },
  { location: "culvercity", label: "Culver City", url: "https://www.shareselfhelp.org/culvercitymeetings" },
];

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    groups: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting name, e.g. 'Anxiety Anonymous'" },
          day_of_week: { type: "integer", minimum: 0, maximum: 6, description: "0=Sunday, 1=Monday ... 6=Saturday" },
          start_time_24h: { type: "string", description: "24h HH:MM, e.g. '18:30'" },
          end_time_24h: { type: "string", description: "24h HH:MM or empty string" },
          time_label: { type: "string", description: "Human time as shown, e.g. '6:30 PM PT'" },
          format: { type: "string", enum: ["in-person", "online", "hybrid"] },
          zoom_id: { type: "string" },
          zoom_url: { type: "string" },
          zoom_password: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["title", "day_of_week", "time_label", "format"],
        additionalProperties: false,
      },
    },
  },
  required: ["groups"],
  additionalProperties: false,
};

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  const attempt = async (waitFor: number) => {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: false, waitFor }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
    const md: string | undefined = data?.data?.markdown ?? data?.markdown;
    return md && md.length > 1000 ? md : null;
  };
  let md = await attempt(10000);
  if (!md) md = await attempt(15000);
  if (!md) throw new Error("Firecrawl returned no markdown after retries");
  return md;
}

async function aiParse(markdown: string, locationLabel: string, lovableKey: string): Promise<any[]> {
  const system =
    "You parse SHARE! Self-Help meeting schedules into strict JSON. Only return meetings that are clearly listed with a day and time. Skip headers, footers, donation notes, and how-to-join instructions. Convert all times to 24h. day_of_week: 0=Sunday,1=Mon...6=Sat. If a meeting is on Zoom only use format='online'; if it lists a physical room AND Zoom use format='hybrid'; if only physical use format='in-person'. Use '' for unknown string fields. Do not invent meetings.";

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Location: SHARE! ${locationLabel}\n\nPage content:\n\n${markdown.slice(0, 60000)}`,
        },
      ],
      tools: [{ type: "function", function: { name: "emit_groups", description: "Emit parsed groups", parameters: PARSE_SCHEMA } }],
      tool_choice: { type: "function", function: { name: "emit_groups" } },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`AI ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("AI returned no tool call");
  const args = JSON.parse(call.function.arguments);
  return args.groups ?? [];
}

function normalizeKey(location: string, title: string, dow: number, t: string): string {
  return `${location}|${dow}|${t || "0000"}|${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;
}

async function runRefresh(sb: any, FIRECRAWL: string, LOVABLE: string) {
  let totalParsed = 0;
  const seenKeys = new Set<string>();
  const errors: string[] = [];

  for (const src of SOURCES) {
    try {
      console.log(`Scraping ${src.url}`);
      const md = await firecrawlScrape(src.url, FIRECRAWL);
      console.log(`Got ${md.length} chars from ${src.location}`);
      const groups = await aiParse(md, src.label, LOVABLE);
      console.log(`Parsed ${groups.length} groups from ${src.location}`);
      totalParsed += groups.length;

      for (const g of groups) {
        if (!g.title || g.day_of_week == null) continue;
        const start = (g.start_time_24h || "").trim() || null;
        const end = (g.end_time_24h || "").trim() || null;
        const key = normalizeKey(src.location, g.title, g.day_of_week, start || "");
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const { error } = await sb.from("peer_support_groups").upsert(
          {
            external_key: key,
            source: "share",
            title: g.title,
            day_of_week: g.day_of_week,
            start_time: start,
            end_time: end,
            time_label: g.time_label || "",
            location: src.location,
            location_label: src.label,
            format: g.format || "in-person",
            zoom_id: g.zoom_id || null,
            zoom_url: g.zoom_url || null,
            zoom_password: g.zoom_password || null,
            description: g.description || null,
            tags: g.tags || null,
            active: true,
            last_verified_at: new Date().toISOString(),
          },
          { onConflict: "external_key" },
        );
        if (error) console.error("Upsert error", error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Source ${src.location} failed:`, msg);
      errors.push(`${src.location}: ${msg}`);
    }
  }

  if (seenKeys.size > 0) {
    const { data: existing } = await sb.from("peer_support_groups").select("id, external_key").eq("source", "share");
    const toDeactivate = (existing || []).filter((r: any) => !seenKeys.has(r.external_key)).map((r: any) => r.id);
    if (toDeactivate.length > 0) {
      await sb.from("peer_support_groups").update({ active: false }).in("id", toDeactivate);
    }
  }

  const success = errors.length === 0 && totalParsed > 0;
  await sb.from("peer_support_refresh_log").insert({
    source: "share",
    success,
    groups_count: seenKeys.size,
    error: errors.length ? errors.join(" | ") : null,
  });
  console.log(`Refresh complete: success=${success} count=${seenKeys.size}`);
}

// @ts-ignore EdgeRuntime is provided at runtime by Supabase
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const FIRECRAWL = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!FIRECRAWL || !LOVABLE) {
    return new Response(JSON.stringify({ error: "missing keys" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const task = runRefresh(sb, FIRECRAWL, LOVABLE).catch((e) => console.error("runRefresh fatal", e));

  try {
    EdgeRuntime.waitUntil(task);
  } catch {
    // Local dev fallback
  }

  return new Response(JSON.stringify({ status: "started", message: "Refresh running in background. Check back in ~60s." }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
