import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getContas, addConta, deleteConta, getMovimentacoes } from '../lib/supabase'
import { fmt, calcSaldoConta, calcPatrimonio } from '../lib/utils'

function ContasPage({ user }) {
  const toast = useToast()
  const [contas, setContas] = useState([])
  const [movs, setMovs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ nome: '', tipo: 'corrente', saldo_inicial: '0', cor: '#6366f1', icon: '🏦' })

  useEffect(() => {
    Promise.all([getContas(user.id), getMovimentacoes(user.id)]).then(([c, m]) => {
      setContas(c); setMovs(m); setLoading(false)
    })
  }, [user.id])

  async function salvar(e) {
    e.preventDefault()
    if (!form.nome) return toast('Digite um nome.', 'error')
    try {
      const nova = await addConta(user.id, { ...form, saldo_inicial: parseFloat(form.saldo_inicial) || 0 })
      setContas(c => [...c, nova])
      setForm({ nome: '', tipo: 'corrente', saldo_inicial: '0', cor: '#6366f1', icon: '🏦' })
      toast('🏦 Conta adicionada!')
    } catch { toast('Erro ao salvar', 'error') }
  }

  async function del(id) {
    if (!confirm('Remover conta? As movimentações associadas não serão apagadas.')) return
    await deleteConta(id)
    setContas(c => c.filter(x => x.id !== id))
    if (selected === id) setSelected(null)
    toast('Conta removida', 'warn')
  }

  const patrimonio = calcPatrimonio(contas, movs)
  const contaMovs = selected ? movs.filter(m => m.conta_nome === contas.find(c => c.id === selected)?.nome) : []

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <>
      <div className="g2">
        <div className="card">
          <div className="card-title">Nova Conta Bancária</div>
          <form onSubmit={salvar}>
            <div className="frow">
              <div className="fg" style={{ flex: 2 }}>
                <label>Nome do Banco / Conta</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Nubank, Bradesco, Carteira..." required />
              </div>
              <div className="fg">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="corrente">🏦 Conta Corrente</option>
                  <option value="poupanca">💚 Poupança</option>
                  <option value="digital">📱 Conta Digital</option>
                  <option value="investimento">📈 Investimento</option>
                  <option value="carteira">👛 Carteira/Dinheiro</option>
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fg">
                <label>Saldo Inicial (R$)</label>
                <input type="number" step="0.01" value={form.saldo_inicial} onChange={e => setForm(f => ({ ...f, saldo_inicial: e.target.value }))} />
              </div>
              <div className="fg" style={{ maxWidth: 80 }}>
                <label>Cor</label>
                <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} />
              </div>
              <div className="fg" style={{ maxWidth: 110 }}>
                <label>Ícone</label>
                <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                  <option value="🏦">🏦 Banco</option>
                  <option value="📱">📱 Digital</option>
                  <option value="💚">💚 Poupança</option>
                  <option value="📈">📈 Investimento</option>
                  <option value="👛">👛 Carteira</option>
                  <option value="💳">💳 Crédito</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">+ Adicionar Conta</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Patrimônio Total</div>
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: patrimonio >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(patrimonio)}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{contas.length} conta{contas.length !== 1 ? 's' : ''}</div>
          </div>
          <div>
            {contas.map(c => {
              const s = calcSaldoConta(c, movs)
              const pct = patrimonio > 0 ? Math.abs(s / patrimonio * 100) : 0
              return (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{c.icon} {c.nome}</span>
                    <span style={{ color: s >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{fmt(s)}</span>
                  </div>
                  <div className="progress"><div className="progress-bar" style={{ width: `${Math.min(pct, 100).toFixed(1)}%`, background: c.cor }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
        {contas.map(c => {
          const s = calcSaldoConta(c, movs)
          return (
            <div key={c.id} className="bank-card" style={{ borderTop: `3px solid ${c.cor}`, cursor: 'pointer', outline: selected === c.id ? `2px solid ${c.cor}` : 'none' }} onClick={() => setSelected(selected === c.id ? null : c.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <button className="btn btn-danger btn-sm btn-icon" onClick={e => { e.stopPropagation(); del(c.id) }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.nome}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>{fmt(s)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, display: 'flex', gap: 8 }}>
                <span>{c.tipo}</span>
                <span>Inicial: {fmt(c.saldo_inicial)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="card">
          <div className="card-title">Movimentações — {contas.find(c => c.id === selected)?.nome}</div>
          {contaMovs.length === 0
            ? <div className="empty"><span className="empty-icon">💸</span>Sem movimentações nesta conta</div>
            : <div className="list">{contaMovs.map(m => {
              const isRec = m.tipo === 'receita'
              const cor = isRec ? 'var(--green)' : 'var(--red)'
              return (
                <div key={m.id} className="tx-item">
                  <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)` }}>{isRec ? '💰' : '💸'}</div>
                  <div className="tx-info">
                    <div className="tx-name">{m.descricao}</div>
                    <div className="tx-meta"><span>{m.categoria}</span></div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount" style={{ color: cor }}>{isRec ? '+' : '-'}{fmt(m.valor)}</div>
                    <div className="tx-date">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              )
            })}</div>
          }
        </div>
      )}
    </>
  )
}

export default withAuth(function ContasPageWrapper({ user }) {
  return (
    <ToastProvider>
      <Layout title="Contas Bancárias" user={user}>
        <ContasPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
