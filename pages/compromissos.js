import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getCompromissos, addCompromisso, deleteCompromisso, getContas } from '../lib/supabase'
import { today, diffDays, TIPO_ICON, TIPO_COR, alertasProximos, fmt } from '../lib/utils'

function CompPage({ user }) {
  const toast = useToast()
  const [comps, setComps] = useState([])
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('proximos')
  const [form, setForm] = useState({ titulo: '', tipo: 'reuniao', data: today(), hora: '09:00', valor: '', conta_nome: '', recorrencia: 'pontual', dias_alerta: '1', observacao: '' })

  useEffect(() => {
    Promise.all([getCompromissos(user.id), getContas(user.id)]).then(([c, co]) => {
      setComps(c); setContas(co); setLoading(false)
    })
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user.id])

  // Check alerts and fire notifications
  useEffect(() => {
    if (!comps.length || Notification.permission !== 'granted') return
    const prox = alertasProximos(comps)
    prox.forEach(c => {
      const key = `notif_${c.id}_${new Date().toDateString()}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        new Notification('FinançasPRO — Lembrete', {
          body: `${c.titulo} · ${new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR')} ${c.hora || ''}`,
          icon: '/icon-192.png',
        })
      }
    })
  }, [comps])

  async function salvar(e) {
    e.preventDefault()
    if (!form.titulo || !form.data) return toast('Preencha título e data.', 'error')
    try {
      const novo = await addCompromisso(user.id, {
        ...form,
        valor: form.valor ? parseFloat(form.valor) : null,
        dias_alerta: parseInt(form.dias_alerta) || 1,
        hora: form.hora || null,
      })
      setComps(c => [...c, novo].sort((a, b) => new Date(a.data) - new Date(b.data)))
      setForm(f => ({ ...f, titulo: '', valor: '', observacao: '' }))
      toast('📅 Compromisso adicionado!')
    } catch { toast('Erro ao salvar', 'error') }
  }

  async function del(id) {
    if (!confirm('Remover compromisso?')) return
    await deleteCompromisso(id)
    setComps(c => c.filter(x => x.id !== id))
    toast('Removido', 'warn')
  }

  const hoje = new Date()
  const proximos = comps.filter(c => c.recorrencia === 'pontual' && new Date(c.data + 'T12:00:00') >= hoje)
  const recorrentes = comps.filter(c => c.recorrencia !== 'pontual')
  const passados = comps.filter(c => c.recorrencia === 'pontual' && new Date(c.data + 'T12:00:00') < hoje)
  const alertas = alertasProximos(comps)

  const tabList = { proximos, recorrentes, passados }
  const current = tabList[tab] || []

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <>
      <div className="g2">
        <div className="card">
          <div className="card-title">Novo Compromisso</div>
          <form onSubmit={salvar}>
            <div className="frow">
              <div className="fg" style={{ flex: 2 }}>
                <label>Título</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião com cliente, Parcela do carro..." required />
              </div>
              <div className="fg">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="reuniao">📅 Reunião</option>
                  <option value="gasto">💸 Gasto fixo</option>
                  <option value="receita">💰 Recebimento</option>
                  <option value="lembrete">🔔 Lembrete</option>
                  <option value="outro">📌 Outro</option>
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fg">
                <label>Data</label>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
              </div>
              <div className="fg">
                <label>Hora</label>
                <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <div className="fg">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="Opcional" />
              </div>
              <div className="fg">
                <label>Conta</label>
                <select value={form.conta_nome} onChange={e => setForm(f => ({ ...f, conta_nome: e.target.value }))}>
                  <option value="">Nenhuma</option>
                  {contas.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fg">
                <label>Recorrência</label>
                <select value={form.recorrencia} onChange={e => setForm(f => ({ ...f, recorrencia: e.target.value }))}>
                  <option value="pontual">📍 Pontual (único)</option>
                  <option value="semanal">🔄 Semanal</option>
                  <option value="mensal">📅 Mensal</option>
                  <option value="anual">🗓️ Anual</option>
                </select>
              </div>
              <div className="fg">
                <label>Alertar (dias antes)</label>
                <input type="number" min="0" max="30" value={form.dias_alerta} onChange={e => setForm(f => ({ ...f, dias_alerta: e.target.value }))} />
              </div>
              <div className="fg" style={{ flex: 2 }}>
                <label>Observação</label>
                <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Detalhes opcionais..." />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">📅 Adicionar Compromisso</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">⚠️ Próximos Alertas</div>
          {alertas.length === 0
            ? <div className="empty"><span className="empty-icon">🔔</span>Nenhum alerta próximo</div>
            : alertas.map(a => {
              const diff = diffDays(a.data)
              return (
                <div key={a.id} className="alert-strip">
                  <div>
                    <div className="alert-title">{TIPO_ICON[a.tipo]} {a.titulo}</div>
                    <div className="alert-sub">{new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')} {a.hora || ''} · {diff === 0 ? '🔴 Hoje!' : diff === 1 ? '🟡 Amanhã' : `🟢 Em ${diff} dias`}</div>
                  </div>
                  {a.valor && <span className="badge badge-amber">{fmt(a.valor)}</span>}
                </div>
              )
            })
          }
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'proximos' ? ' active' : ''}`} onClick={() => setTab('proximos')}>📍 Próximos ({proximos.length})</button>
        <button className={`tab${tab === 'recorrentes' ? ' active' : ''}`} onClick={() => setTab('recorrentes')}>🔄 Recorrentes ({recorrentes.length})</button>
        <button className={`tab${tab === 'passados' ? ' active' : ''}`} onClick={() => setTab('passados')}>📁 Passados ({passados.length})</button>
      </div>

      <div className="card">
        {current.length === 0
          ? <div className="empty"><span className="empty-icon">📅</span>Nenhum compromisso</div>
          : current.map(c => {
            const diff = diffDays(c.data)
            const cor = TIPO_COR[c.tipo] || 'var(--text2)'
            const urgCor = diff < 0 ? 'var(--text3)' : diff <= 1 ? 'var(--red)' : diff <= 3 ? 'var(--amber)' : cor
            return (
              <div key={c.id} className="comp-item">
                <div className="comp-dot" style={{ background: urgCor }} />
                <div className="comp-info">
                  <div className="comp-title">
                    {TIPO_ICON[c.tipo]} {c.titulo}
                    {c.recorrencia !== 'pontual' && <span className="badge badge-blue" style={{ marginLeft: 6 }}>{c.recorrencia}</span>}
                    {c.via_audio && <span className="badge badge-purple" style={{ marginLeft: 4 }}>🎤</span>}
                  </div>
                  <div className="comp-meta">
                    {new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR')} {c.hora ? `às ${c.hora}` : ''}
                    {diff >= 0 ? ` · ${diff === 0 ? '🔴 Hoje!' : diff === 1 ? '🟡 Amanhã' : `Em ${diff} dias`}` : ' · Passado'}
                    {c.valor ? ` · ${fmt(c.valor)}` : ''}
                    {c.conta_nome ? ` · ${c.conta_nome}` : ''}
                    {c.observacao ? ` · ${c.observacao}` : ''}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(c.id)}>✕</button>
              </div>
            )
          })
        }
      </div>
    </>
  )
}

export default withAuth(function CompPageWrapper({ user }) {
  return (
    <ToastProvider>
      <Layout title="Compromissos" user={user}>
        <CompPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
