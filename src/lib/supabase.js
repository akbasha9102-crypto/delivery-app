import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// تم ربط مشروع Supabase بنجاح
const supabaseUrl = 'https://gbmwrvnmvobvieembxmf.supabase.co';
const supabaseAnonKey = 'sb_publishable_DB8lKUjdnAah-jNbpFV22w_7Id2Eggr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
