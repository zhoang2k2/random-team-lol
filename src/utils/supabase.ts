import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://xupqtybuhocuzrjznfay.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_B4gqr1bKkyEbj0TQHaEF1w_Ydjaq2Qs";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
