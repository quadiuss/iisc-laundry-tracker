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

const SUPABASE_URL = "https://ufzznlqlujpweovlnibx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmenpubHFsdWpwd2VvdmxuaWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1OTYzODQsImV4cCI6MjEwMTE3MjM4NH0.GMSVd_k0zjdbvSH-tTNP0EkTjXSGEPzMKj1M-ya5K6c";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
