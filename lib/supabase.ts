import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cqawpajlqursuyzogxbf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYXdwYWpscXVyc3V5em9neGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTA5NTYsImV4cCI6MjA1Nzk2Njk1Nn0.ZITAgjXuI4LCltm2cYx0Dz_t5p390SpljhkXNpUYVG0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    },
  }
});
