import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Durante prerender/build sem env pública definida, evita quebrar a compilação.
  // Em runtime real (browser), exigimos variáveis corretas.
  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      return createBrowserClient('http://127.0.0.1:54321', 'public-anon-key-placeholder')
    }
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(
    url,
    anonKey
  )
}