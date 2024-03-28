import { createClient } from '@supabase/supabase-js';

export const supabaseClient = (supabaseToken) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      headers: {
        Authorization: `Bearer ${supabaseToken}`,
      },
    }
  );

  return supabase;
};
