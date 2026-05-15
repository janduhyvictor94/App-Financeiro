import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getMovimentacoes, addMovimentacao, deleteMovimentacao, getContas, getCategorias } from '../lib/supabase'
import { fmt, today } from '../lib/utils'

function MovPage({ user }) {
  const toast = useToast()
  const [movs, setMovs] = useState([])
  const [contas, setContas] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtros, setFiltros] = useState({ tipo: '', conta: '', categoria: '' })

  // Form
  const [form, setForm] = useState({ descricao: '', valor: '', tipo: 'despesa', categoria: '', conta_nome: '', data: today(), observacao: '' })

  useEffect(() => {
    Promise.all([getMovimentacoes(user.id), getContas(user.id), getCategorias(user.id)]).then(([m, c, ca]) => {
      setMovs(m); setContas(c); setCats(ca)
      setForm(f => ({ ...f, categoria: ca[0]?.nome || '' }))
      setLoading(false)
    })
  }, [user.id])

  async function salvar(e) {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) return toast('Preencha descrição, valor e data.', 'error')
    setSaving(true)
    try {
      const novo = await addMovimentacao(user.id, { ...form, valor: parseFloat(form.valor) })
      setMovs(m => [novo, ...m])
      setForm(f => ({ ...f, descricao: '', valor: '', observacao: '' }))
      toast('✅ Movimentação adicionada!')
    } catch { toast('Erro ao salvar', 'error') }
    setSaving(false)
  }

  async function del(id) {
    if (!confirm('Remover movimentação?')) return
    await deleteMovimentacao(id)
    setMovs(m => m.filter(x => x.id !== id))
    toast('Removida', 'warn')
  }

  const filtered = movs.filter(m =>
    (!filtros.tipo || m.tipo === filtros.tipo) &&
    (!filtros.conta || m.conta_nome === filtros.conta) &&
    (!filtros.categoria || m.categoria === filtros.categoria)
  )

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <>
      <div className="card">
        <div className="card-title">Nova Movimentação</div>
        <form onSubmit={salvar}>
          <div className="frow">
            <div className="fg" style={{ flex: 2 }}>
              <label>Descrição</label>
              <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Aluguel, Salário..." required />
            </div>
            <div className="fg">
              <label>Valor (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" required />
            </div>
            <div className="fg">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="despesa">💸 Despesa</option>
                <option value="receita">💰 Receita</option>
                <option value="transferencia">🔄 Transferência</option>
              </select>
            </div>
          </div>
          <div className="frow">
            <div className="fg">
              <label>Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {cats.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Conta Bancária</label>
              <select value={form.conta_nome} onChange={e => setForm(f => ({ ...f, conta_nome: e.target.value }))}>
                <option value="">Sem conta</option>
                {contas.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
            </div>
            <div className="fg">
              <label>Observação</label>
              <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : '+ Adicionar'}</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">
          Histórico ({filtered.length})
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }}>
              <option value="">Todos tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="transferencia">Transferências</option>
            </select>
            <select value={filtros.conta} onChange={e => setFiltros(f => ({ ...f, conta: e.target.value }))} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }}>
              <option value="">Todas contas</option>
              {contas.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
            <select value={filtros.categoria} onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value }))} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }}>
              <option value="">Todas categorias</option>
              {cats.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        {filtered.length === 0
          ? <div className="empty"><span className="empty-icon">💸</span>Nenhuma movimentação</div>
          : <div className="list">{filtered.map(m => <TxItemDel key={m.id} m={m} onDel={del} />)}</div>
        }
      </div>
    </>
  )
}

function TxItemDel({ m, onDel }) {
  const isRec = m.tipo === 'receita', isT = m.tipo === 'transferencia'
  const cor = isRec ? 'var(--green)' : isT ? 'var(--sky)' : 'var(--red)'
  return (
    <div className="tx-item">
      <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)`, fontSize: 16 }}>{isRec ? '💰' : isT ? '🔄' : '💸'}</div>
      <div className="tx-info">
        <div className="tx-name">{m.descricao}</div>
        <div className="tx-meta">
          <span className={`badge ${isRec ? 'badge-green' : isT ? 'badge-blue' : 'badge-red'}`}>{isRec ? 'Receita' : isT ? 'Transf.' : 'Despesa'}</span>
          <span>{m.categoria}</span>
          {m.conta_nome && <span style={{ color: 'var(--text3)' }}>{m.conta_nome}</span>}
          {m.via_audio && <span className="badge badge-purple">🎤 Áudio</span>}
        </div>
      </div>
      <div className="tx-right">
        <div className="tx-amount" style={{ color: cor }}>{isRec ? '+' : isT ? '' : '-'}{fmt(m.valor)}</div>
        <div className="tx-date">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
      </div>
      <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDel(m.id)}>✕</button>
    </div>
  )
}

export default withAuth(function MovimentacoesPage({ user }) {
  return (
    <ToastProvider>
      <Layout title="Movimentações" user={user}>
        <MovPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
