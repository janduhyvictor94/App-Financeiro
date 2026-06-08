import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getContas, addConta, deleteConta, updateContaSaldo, getMovimentacoes, getFundos, addFundo, deleteFundo, desfazerUltima, ultimaAcao } from '../lib/supabase'
import { fmt, calcSaldoConta, calcPatrimonio, today } from '../lib/utils'

function ContasPage({ user }) {
  const toast = useToast()
  const [contas, setContas] = useState([])
  const [movs, setMovs] = useState([])
  const [fundos, setFundos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [modalFundo, setModalFundo] = useState(null) // { conta, tipo }
  const [valorFundo, setValorFundo] = useState('')
  const [descFundo, setDescFundo] = useState('')
  const [temUndo, setTemUndo] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'corrente', saldo_inicial: '0', cor: '#6366f1', icon: '🏦' })

  async function recarregar() {
    const [c, m, f] = await Promise.all([getContas(user.id), getMovimentacoes(user.id), getFundos(user.id)])
    setContas(c); setMovs(m); setFundos(f)
    const ult = await ultimaAcao(user.id)
    setTemUndo(!!ult)
  }

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [user.id])

  async function salvar(e) {
    e.preventDefault()
    if (!form.nome) return toast('Digite um nome.', 'error')
    try {
      await addConta(user.id, { ...form, saldo_inicial: parseFloat(form.saldo_inicial) || 0 })
      await recarregar()
      setForm({ nome: '', tipo: 'corrente', saldo_inicial: '0', cor: '#6366f1', icon: '🏦' })
      toast('🏦 Conta adicionada!')
    } catch { toast('Erro ao salvar', 'error') }
  }

  async function del(id) {
    if (!confirm('Remover conta? As movimentações e fundos associados continuam.')) return
    await deleteConta(id, user.id)
    await recarregar()
    if (selected === id) setSelected(null)
    toast('Conta removida — use ↶ Desfazer se quiser reverter', 'warn')
  }

  function abrirModalFundo(conta, tipo) {
    setModalFundo({ conta, tipo })
    setValorFundo('')
    setDescFundo('')
  }

  async function salvarFundo() {
    const valor = parseFloat(valorFundo)
    if (isNaN(valor) || valor <= 0) return toast('Digite um valor válido.', 'error')
    try {
      await addFundo(user.id, {
        conta_id: modalFundo.conta.id,
        conta_nome: modalFundo.conta.nome,
        valor: valor,
        tipo: modalFundo.tipo,
        descricao: descFundo || (modalFundo.tipo === 'aporte' ? 'Adição de fundos' : 'Retirada de fundos'),
        data: today(),
      })
      await recarregar()
      setModalFundo(null)
      toast(modalFundo.tipo === 'aporte' ? '💵 Fundos adicionados!' : '💸 Fundos retirados!')
    } catch (e) {
      toast('Erro: ' + e.message, 'error')
    }
  }

  async function desfazer() {
    try {
      const acao = await desfazerUltima(user.id)
      await recarregar()
      toast(`↶ Desfeita: ${acao.acao} ${acao.tabela}`)
    } catch (e) {
      toast('Nada para desfazer', 'warn')
    }
  }

  const patrimonio = calcPatrimonio(contas, movs, fundos)

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <>
      {/* Barra de desfazer */}
      {temUndo && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>💡 Você pode desfazer a última ação se algo deu errado</span>
          <button className="btn btn-ghost btn-sm" onClick={desfazer}>↶ Desfazer última ação</button>
        </div>
      )}

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
              const s = calcSaldoConta(c, movs, fundos)
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 12 }}>
        {contas.map(c => {
          const s = calcSaldoConta(c, movs, fundos)
          const fromMovs = movs.filter(m => m.conta_nome === c.nome).reduce((a, m) => m.tipo === 'receita' ? a + Number(m.valor) : a - Number(m.valor), 0)
          const fromFundos = fundos.filter(f => f.conta_nome === c.nome).reduce((a, f) => f.tipo === 'aporte' ? a + Number(f.valor) : -Number(f.valor), 0)
          return (
            <div key={c.id} className="bank-card" style={{ borderTop: `3px solid ${c.cor}`, outline: selected === c.id ? `2px solid ${c.cor}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(c.id)}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.nome}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>{fmt(s)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
                Inicial: {fmt(c.saldo_inicial)}
                {fromFundos !== 0 && <span> · Fundos: {fromFundos >= 0 ? '+' : ''}{fmt(fromFundos)}</span>}
                {fromMovs !== 0 && <span> · Movs: {fromMovs >= 0 ? '+' : ''}{fmt(fromMovs)}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 10 }}>
                <button className="btn btn-success btn-sm" style={{ fontSize: 11 }} onClick={() => abrirModalFundo(c, 'aporte')}>
                  💵 Adicionar
                </button>
                <button className="btn btn-amber btn-sm" style={{ fontSize: 11 }} onClick={() => abrirModalFundo(c, 'saque')}>
                  💸 Retirar
                </button>
                <button className="btn btn-ghost btn-sm" style={{ gridColumn: 'span 2', fontSize: 11 }} onClick={() => setSelected(selected === c.id ? null : c.id)}>
                  📋 {selected === c.id ? 'Ocultar' : 'Ver'} movimentações
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de fundo */}
      {modalFundo && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={() => setModalFundo(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 380, margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{ marginBottom: 14 }}>
              {modalFundo.tipo === 'aporte' ? '💵 Adicionar Fundos' : '💸 Retirar Fundos'}
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModalFundo(null)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
              Conta: <strong style={{ color: 'var(--text)' }}>{modalFundo.conta.icon} {modalFundo.conta.nome}</strong><br />
              <span style={{ color: 'var(--text3)' }}>
                {modalFundo.tipo === 'aporte'
                  ? 'Adicione dinheiro à conta (depósito, aporte, transferência recebida) sem ser receita do mês.'
                  : 'Retire dinheiro da conta (saque, transferência enviada) sem ser despesa do mês.'}
              </span>
            </p>
            <div className="fg" style={{ marginBottom: 10 }}>
              <label>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorFundo}
                onChange={e => setValorFundo(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
            <div className="fg" style={{ marginBottom: 14 }}>
              <label>Descrição (opcional)</label>
              <input
                type="text"
                value={descFundo}
                onChange={e => setDescFundo(e.target.value)}
                placeholder="Ex: Depósito em dinheiro, transferência..."
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={modalFundo.tipo === 'aporte' ? 'btn btn-success' : 'btn btn-amber'} style={{ flex: 1 }} onClick={salvarFundo}>
                ✓ Confirmar
              </button>
              <button className="btn btn-ghost" onClick={() => setModalFundo(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detalhes da conta selecionada */}
      {selected && (() => {
        const contaSel = contas.find(c => c.id === selected)
        const contaMovs = movs.filter(m => m.conta_nome === contaSel?.nome)
        const contaFundos = fundos.filter(f => f.conta_nome === contaSel?.nome)
        return (
          <div className="card">
            <div className="card-title">Histórico — {contaSel?.nome}</div>
            {contaFundos.length > 0 && (
              <>
                <div className="sdiv">Aportes e Retiradas</div>
                {contaFundos.map(f => (
                  <div key={f.id} className="tx-item" style={{ marginBottom: 6 }}>
                    <div className="tx-icon" style={{ background: f.tipo === 'aporte' ? 'color-mix(in srgb, var(--green) 15%, transparent)' : 'color-mix(in srgb, var(--amber) 15%, transparent)' }}>
                      {f.tipo === 'aporte' ? '💵' : '💸'}
                    </div>
                    <div className="tx-info">
                      <div className="tx-name">{f.descricao}</div>
                      <div className="tx-meta">
                        <span className={`badge ${f.tipo === 'aporte' ? 'badge-green' : 'badge-amber'}`}>{f.tipo}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-amount" style={{ color: f.tipo === 'aporte' ? 'var(--green)' : 'var(--amber)' }}>
                        {f.tipo === 'aporte' ? '+' : '-'}{fmt(f.valor)}
                      </div>
                      <div className="tx-date">{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                    </div>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={async () => {
                      if (!confirm('Remover este aporte/retirada?')) return
                      await deleteFundo(f.id, user.id)
                      await recarregar()
                      toast('Removido', 'warn')
                    }}>✕</button>
                  </div>
                ))}
              </>
            )}
            {contaMovs.length > 0 && (
              <>
                <div className="sdiv">Movimentações (receitas e despesas)</div>
                {contaMovs.map(m => {
                  const isRec = m.tipo === 'receita'
                  return (
                    <div key={m.id} className="tx-item" style={{ marginBottom: 6 }}>
                      <div className="tx-icon" style={{ background: `color-mix(in srgb, ${isRec ? 'var(--green)' : 'var(--red)'} 15%, transparent)` }}>{isRec ? '💰' : '💸'}</div>
                      <div className="tx-info">
                        <div className="tx-name">{m.descricao}</div>
                        <div className="tx-meta"><span>{m.categoria}</span></div>
                      </div>
                      <div className="tx-right">
                        <div className="tx-amount" style={{ color: isRec ? 'var(--green)' : 'var(--red)' }}>{isRec ? '+' : '-'}{fmt(m.valor)}</div>
                        <div className="tx-date">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
            {contaFundos.length === 0 && contaMovs.length === 0 && (
              <div className="empty"><span className="empty-icon">💸</span>Nenhum lançamento nesta conta</div>
            )}
          </div>
        )
      })()}

      <div className="card" style={{ background: 'color-mix(in srgb, var(--sky) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--sky) 25%, transparent)' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--sky)' }}>💡 Como funcionam os 3 tipos de lançamento</strong><br />
          <strong style={{ color: 'var(--green)' }}>💵 Aporte (Adicionar Fundos)</strong> — coloca dinheiro na conta (depósito próprio, transferência recebida que não é renda). Aumenta o saldo, NÃO conta como receita do mês.<br />
          <strong style={{ color: 'var(--amber)' }}>💸 Saque (Retirar Fundos)</strong> — tira dinheiro da conta sem ser despesa do mês. Diminui o saldo.<br />
          <strong style={{ color: 'var(--accent)' }}>📊 Receita / Despesa (em Movimentações)</strong> — lança ganhos e gastos que contam no <strong>Saldo do Mês</strong> e nos gráficos.<br /><br />
          O <strong>↶ Desfazer</strong> reverte a última ação se você errar.
        </div>
      </div>
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