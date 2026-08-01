// public/js/supabaseClient.js
//
// These are your PUBLIC Supabase credentials — the URL and the "anon" key.
// It is safe for these to be visible in frontend code (this is standard
// practice, same as a Firebase config object). Real security comes from
// Row Level Security policies in the database (see supabase/schema.sql),
// NOT from hiding these values.
//
// Replace the two values below with your own project's values from:
// Supabase Dashboard -> Project Settings -> API

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
