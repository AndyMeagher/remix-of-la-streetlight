

# Fix: Deploy register-device-token Edge Function

## Problem
The edge function file exists but was never successfully deployed — likely because the CORS import (`https://esm.sh/@supabase/supabase-js@2.49.4/cors`) doesn't resolve on esm.sh, causing a deploy error.

## Solution
Replace the broken CORS import with inline CORS headers (the standard pattern), then explicitly deploy the function.

## Steps

### 1. Update `supabase/functions/register-device-token/index.ts`
- Remove the `corsHeaders` import from `esm.sh`
- Define `corsHeaders` inline:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```
- Keep everything else unchanged

### 2. Deploy the function
Use the deploy tool to push `register-device-token` to the edge runtime.

### Files changed
- **Modified**: `supabase/functions/register-device-token/index.ts` — fix CORS import

