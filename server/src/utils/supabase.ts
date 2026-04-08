import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing in environment variables.");
}

// supabase: Exported instance of the Supabase client for storage and database interactions
export const supabase = createClient(supabaseUrl, supabaseKey);
