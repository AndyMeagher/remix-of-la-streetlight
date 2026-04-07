import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { device_id, platform, token, p256dh, auth } = body;

    // Validate required fields
    if (!device_id || typeof device_id !== "string" || device_id.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid device_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!platform || !["ios", "web"].includes(platform)) {
      return new Response(
        JSON.stringify({ error: "platform must be 'ios' or 'web'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!token || typeof token !== "string" || token.length > 4096) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabaseAdmin.from("device_tokens").upsert(
      {
        device_id,
        platform,
        token,
        p256dh: p256dh ?? null,
        auth: auth ?? null,
      },
      { onConflict: "device_id" },
    );

    if (error) {
      console.error("Upsert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to register token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Bad request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
