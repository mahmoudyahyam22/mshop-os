import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// التحقق الآن يعتمد على وجود متغيرات البيئة.
// إذا كانت المتغيرات غير موجودة، فلن يتم تكوين الاتصال بقاعدة البيانات.
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

// مخطط قاعدة البيانات يستخدم snake_case، لكن أنواع TypeScript لدينا تستخدم camelCase.
// عميل Supabase يتعامل مع هذا التحويل تلقائيًا، لذلك لا نحتاج إلى تغيير أنواعنا.
export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const isSupabaseConfigured = isConfigured;