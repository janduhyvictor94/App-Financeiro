import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState('login') // login | cadastro
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !senha) return setErro('Preencha e-mail e senha.')
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setLoading(true)
    setErro('')
    setMsg('')

    if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro('E-mail ou senha incorretos.')
        setLoading(false)
        return
      }
      router.replace('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha })
      if (error) {
        setErro('Erro ao criar conta: ' + error.message)
        setLoading(false)
        return
      }
      setMsg('Conta criada! Verifique seu e-mail para confirmar, ou tente fazer login.')
      setModo('login')
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Login — FinançasPRO</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>💰</div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>FinançasPRO</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Sua saúde financeira em um só lugar</p>
          </div>

          <div className="card">
            {/* Tabs login/cadastro */}
            <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 4, marginBottom: 20, border: '1px solid var(--border)' }}>
              <button
                onClick={() => { setModo('login'); setErro(''); setMsg('') }}
                style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', transition: '.15s', fontFamily: 'inherit', background: modo === 'login' ? 'var(--bg2)' : 'transparent', color: modo === 'login' ? 'var(--text)' : 'var(--text2)', fontWeight: modo === 'login' ? 500 : 400 }}
              >
                Entrar
              </button>
              <button
                onClick={() => { setModo('cadastro'); setErro(''); setMsg('') }}
                style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', transition: '.15s', fontFamily: 'inherit', background: modo === 'cadastro' ? 'var(--bg2)' : 'transparent', color: modo === 'cadastro' ? 'var(--text)' : 'var(--text2)', fontWeight: modo === 'cadastro' ? 500 : 400 }}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="fg" style={{ marginBottom: 16 }}>
                <label>Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {erro && (
                <div style={{ background: 'color-mix(in srgb, var(--red) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>
                  {erro}
                </div>
              )}
              {msg && (
                <div style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: 12, color: 'var(--green)', marginBottom: 12 }}>
                  {msg}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Aguarde...' : modo === 'login' ? '🔐 Entrar' : '✅ Criar minha conta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 14 }}>
              {modo === 'login' ? 'Não tem conta? Clique em "Criar conta" acima.' : 'Já tem conta? Clique em "Entrar" acima.'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}