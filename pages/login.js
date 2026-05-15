import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [router])

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <>
      <Head><title>Login — FinançasPRO</title></Head>
      <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>💰</div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>FinançasPRO</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Sua saúde financeira em um só lugar</p>
          </div>

          <div className="card">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Verifique seu e-mail!</p>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>Enviamos um link mágico para <strong style={{ color: 'var(--text)' }}>{email}</strong>. Clique no link para entrar.</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => setSent(false)}>Tentar outro e-mail</button>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost btn-full" onClick={handleGoogle} style={{ marginBottom: 14, gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Entrar com Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>ou via e-mail</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <form onSubmit={handleMagicLink}>
                  <div className="fg" style={{ marginBottom: 10 }}>
                    <label>E-mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
                  </div>
                  {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{error}</p>}
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Enviando...' : '✉️ Enviar link de acesso'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 14 }}>
                  Sem senha. Acesso seguro por link.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
