import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppheftathlniqphituey.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGVmdGF0aGxuaXFwaGl0dWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTQyMjIsImV4cCI6MjA4NjM5MDIyMn0.0okR6ouEIdB5e_6NgM3GMeuSEICOz2UDdyDKeZThDHs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_URL = supabaseUrl;
