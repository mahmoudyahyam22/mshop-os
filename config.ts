// يتم الآن قراءة متغيرات Supabase من متغيرات البيئة (Environment Variables) أولاً.
// هذا يجعل التطبيق أكثر أمانًا وجاهزًا للنشر على منصات مثل Vercel.
// إذا لم تكن متغيرات البيئة موجودة، سيتم استخدام القيم المكتوبة أدناه كبديل للتطوير المحلي.
//
// عند النشر على Vercel، قم بإضافة هذه المتغيرات في إعدادات المشروع:
// VITE_SUPABASE_URL = "https://your-project-ref.supabase.co"
// VITE_SUPABASE_ANON_KEY = "your-supabase-anon-key"

// Use environment variables if available, otherwise fall back to the hardcoded values for local development.
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL ?? "https://dophrscdrbilmgonewzk.supabase.co";
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcGhyc2NkcmJpbG1nb25ld3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTM2NzgsImV4cCI6MjA3NzE4OTY3OH0.DgzCKN8Gt45_VzbdAcr9Wmhh-4R68Ru23jeR8AkrzO4";
