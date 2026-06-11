import { createClient } from '@supabase/supabase-js'

// .env 안 쓰고 그냥 직통으로 박아버리기
const supabaseUrl = 'https://xcqcwrbeecjmvyegohzc.supabase.co'
const supabaseKey = 'sb_publishable_1ZU-NhBq9bpE5ziTiltPVg_oa7yT65j'

export const supabase = createClient(supabaseUrl, supabaseKey)
