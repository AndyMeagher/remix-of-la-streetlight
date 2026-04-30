import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { device_id, platform, token, p256dh, auth, endpoint } = body;

    // Validate required fields
    if (!device_id || typeof device_id !== "string" || device_id.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid device_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!platform || !["ios", "android", "web"].includes(platform)) {
      return new Response(
        JSON.stringify({ error: "platform must be 'ios', 'android', or 'web'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (platform === "ios" || platform === "android") {
      // iOS: token is the APNs device token
      if (!token || typeof token !== "string" || token.length > 4096) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error } = await supabaseAdmin.from("device_tokens").upsert(
        { device_id, platform, token, p256dh: null, auth: null },
        { onConflict: "device_id" },
      );

      if (error) {
        console.error("Upsert device_tokens error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to register token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // Web: needs endpoint, p256dh, auth for web push
      const webEndpoint = endpoint || token;
      if (!webEndpoint || typeof webEndpoint !== "string" || webEndpoint.length > 4096) {
        return new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!p256dh || typeof p256dh !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid p256dh" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!auth || typeof auth !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid auth" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Upsert into push_subscriptions (web push credentials)
      const { error: psError } = await supabaseAdmin.from("push_subscriptions").upsert(
        {
          device_id,
          endpoint: webEndpoint,
          p256dh,
          auth,
        },
        { onConflict: "device_id" },
      );

      if (psError) {
        console.error("Upsert push_subscriptions error:", psError);
        return new Response(
          JSON.stringify({ error: "Failed to register subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Also upsert into device_tokens for unified tracking
      const { error: dtError } = await supabaseAdmin.from("device_tokens").upsert(
        { device_id, platform: "web", token: webEndpoint, p256dh, auth },
        { onConflict: "device_id" },
      );

      if (dtError) {
        console.error("Upsert device_tokens error:", dtError);
        // Non-fatal — push_subscriptions is the primary web table
      }
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
