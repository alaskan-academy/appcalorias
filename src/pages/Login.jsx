import { useState } from 'react'
import { Zap, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '../utils/supabase'

export default function Login() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })

    setLoading(false)
    if (error) {
      setError(error.message || 'Não foi possível enviar o link. Tente novamente.')
      console.error('[login error]', error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Zap size={30} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">NutriTrack</h1>
            <p className="text-sm text-zinc-500 mt-1">Nutrição e fitness no seu ritmo</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {sent ? (
            /* ── Estado: link enviado ── */
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Link enviado!</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Confira seu e-mail <span className="text-zinc-300">{email}</span> e clique no link para entrar.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            /* ── Estado: formulário ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-white">Entrar no app</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Digite seu e-mail — vamos te mandar um link de acesso.
                </p>
              </div>

              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoFocus
                  required
                  className="input pl-9 text-sm"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Enviar link de acesso <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-zinc-600 text-center">
          Sem senha. Seus dados ficam salvos na nuvem e sincronizados em todos os dispositivos.
        </p>
      </div>
    </div>
  )
}
