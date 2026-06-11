import { createClient } from '@supabase/supabase-js'

// Vercel이 이 변수들을 읽어서 키 값을 꽂아줄 겁니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
