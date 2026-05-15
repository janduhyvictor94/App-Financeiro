import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getCategorias, addCategoria, deleteCategoria } from '../lib/supabase'

function CatPage({ user }) {
  const toast = useToast()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', cor: '#6366f1', icon: '📌' })

  useEffect(() => {
    getCategorias(user.id).then(c => { setCats(c); setLoading(false) })
  }, [user.id])

  async function salvar(e) {
    e.preventDefault()
    if (!form.nome) return toast('Digite um nome.', 'error')
    if (cats.find(c => c.nome.toLowerCase() === form.nome.toLowerCase())) return toast('Categoria já existe!', 'warn')
    try {
      const nova = await addCategoria(user.id, form)
      setCats(c => [...c, nova])
      setForm(f => ({ ...f, nome: '' }))
      toast('🏷️ Categoria criada!')
    } catch { toast('Erro ao salvar', 'error') }
  }

  async function del(id) {
    const c = cats.find(x => x.id === id)
    if (c?.nome === 'Outros') return toast('Não é possível remover "Outros"', 'warn')
    await deleteCategoria(id)
    setCats(c => c.filter(x => x.id !== id))
  }

  const ICONS = ['📌','🏠','🛒','🍔','🚗','💊','🎮','📚','💰','📱','⚡','✈️','🏋️','🐾','🎵','👕','🏥','💼','🎁','🔧','📊','🎨','🌱','☕','🎓']

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <div className="g2">
      <div className="card">
        <div className="card-title">Nova Categoria</div>
        <form onSubmit={salvar}>
          <div className="frow">
            <div className="fg" style={{ flex: 2 }}>
              <label>Nome</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Academia, Pets, Streaming..." required />
            </div>
            <div className="fg" style={{ maxWidth: 80 }}>
              <label>Cor</label>
              <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} />
            </div>
          </div>
          <div className="fg" style={{ marginBottom: 10 }}>
            <label>Ícone</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{ width: 36, height: 36, borderRadius: 'var(--r2)', border: `2px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, background: form.icon === ic ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg3)', cursor: 'pointer', fontSize: 18 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">+ Criar Categoria</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Minhas Categorias ({cats.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {cats.map(c => (
            <div key={c.id} className="cat-chip" style={{ borderColor: `color-mix(in srgb, ${c.cor} 40%, transparent)`, background: `color-mix(in srgb, ${c.cor} 12%, transparent)` }}>
              <span>{c.icon}</span>
              <span style={{ color: c.cor, fontWeight: 500 }}>{c.nome}</span>
              <span className="cat-del" onClick={() => del(c.id)}>×</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default withAuth(function CatPageWrapper({ user }) {
  return (
    <ToastProvider>
      <Layout title="Categorias" user={user}>
        <CatPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
