import { createClient } from '@supabase/supabase-js'

// 아까 찾은 형의 고유 주소와 anon public 키
const supabaseUrl = 'https://xcqcwrbeecjmvyegohzc.supabase.co'
const supabaseKey = 'sb_publishable_1ZU-NhBq9bpE5ziTiltPVg_oa7yT65j'

// 수파베이스 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)
