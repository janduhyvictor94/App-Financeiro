import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { ToastProvider } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getMovimentacoes, getContas, getCompromissos } from '../lib/supabase'
import { fmt, filtrarMes, mesAtual, somaReceitas, somaDespesas, calcSaldoConta, calcPatrimonio, alertasProximos, diffDays, TIPO_ICON } from '../lib/utils'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

function Dashboard({ user }) {
  const [movs, setMovs] = useState([])
  const [contas, setContas] = useState([])
  const [comps, setComps] = useState([])
  const [loading, setLoading] = useState(true)
  const barRef = useRef(null)
  const pieRef = useRef(null)
  const barChart = useRef(null)
  const pieChart = useRef(null)

  useEffect(() => {
    Promise.all([
      getMovimentacoes(user.id),
      getContas(user.id),
      getCompromissos(user.id),
    ]).then(([m, c, co]) => {
      setMovs(m); setContas(c); setComps(co); setLoading(false)
    })
  }, [user.id])

  useEffect(() => {
    if (loading) return
    buildCharts()
    return () => { barChart.current?.destroy(); pieChart.current?.destroy() }
  }, [loading, movs])

  function buildCharts() {
    const now = new Date()
    const labels = [], recArr = [], despArr = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(d.toLocaleString('pt-BR', { month: 'short' }))
      const ms = filtrarMes(movs, d.getMonth(), d.getFullYear())
      recArr.push(somaReceitas(ms))
      despArr.push(somaDespesas(ms))
    }
    barChart.current?.destroy()
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Receitas', data: recArr, backgroundColor: '#10b98150', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 },
          { label: 'Despesas', data: despArr, backgroundColor: '#f43f5e50', borderColor: '#f43f5e', borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8892b0', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#8892b0' }, grid: { color: '#1e244220' } }, y: { ticks: { color: '#8892b0', callback: v => 'R$' + v.toLocaleString('pt-BR') }, grid: { color: '#1e244240' } } } },
    })

    const { mes, ano } = mesAtual()
    const mesMov = filtrarMes(movs, mes, ano)
    const catMap = {}
    mesMov.filter(m => m.tipo === 'despesa').forEach(m => { catMap[m.categoria] = (catMap[m.categoria] || 0) + Number(m.valor) })
    const ck = Object.keys(catMap)
    pieChart.current?.destroy()
    if (ck.length) {
      pieChart.current = new Chart(pieRef.current, {
        type: 'doughnut',
        data: { labels: ck, datasets: [{ data: ck.map(k => catMap[k]), backgroundColor: ['#6366f1','#10b981','#f43f5e','#f59e0b','#0ea5e9','#8b5cf6','#f97316','#8892b0'], borderColor: '#131728', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8892b0', font: { size: 11 }, boxWidth: 10 } } } },
      })
    }
  }

  const { mes, ano } = mesAtual()
  const mesMov = filtrarMes(movs, mes, ano)
  const rec = somaReceitas(mesMov)
  const desp = somaDespesas(mesMov)
  const saldo = rec - desp
  const patrimonio = calcPatrimonio(contas, movs)
  const alertas = alertasProximos(comps)
  const ultimas = [...movs].slice(0, 6)

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <ToastProvider>
      <div className="g4">
        <div className="metric"><div className="metric-label">Patrimônio Total</div><div className="metric-value" style={{ color: patrimonio >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(patrimonio)}</div><div className="metric-sub">Soma de todas as contas</div></div>
        <div className="metric"><div className="metric-label">Receitas do Mês</div><div className="metric-value" style={{ color: 'var(--green)' }}>{fmt(rec)}</div><div className="metric-sub">{mesMov.filter(m => m.tipo === 'receita').length} lançamentos</div></div>
        <div className="metric"><div className="metric-label">Despesas do Mês</div><div className="metric-value" style={{ color: 'var(--red)' }}>{fmt(desp)}</div><div className="metric-sub">{mesMov.filter(m => m.tipo === 'despesa').length} lançamentos</div></div>
        <div className="metric"><div className="metric-label">Saldo do Mês</div><div className="metric-value" style={{ color: saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(saldo)}</div><div className="metric-sub">{saldo >= 0 ? '✅ No azul' : '⚠️ No vermelho'}</div></div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title">Receitas vs Despesas<span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span></div>
          <div className="chart-wrap"><canvas ref={barRef} /></div>
        </div>
        <div className="card">
          <div className="card-title">Gastos por Categoria</div>
          <div className="chart-wrap"><canvas ref={pieRef} /></div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title">Saldo por Conta</div>
          {contas.length === 0 ? <div className="empty"><span className="empty-icon">🏦</span>Nenhuma conta cadastrada</div> : contas.map(c => {
            const s = calcSaldoConta(c, movs)
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${c.cor} 20%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{c.icon}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.tipo}</div></div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: s >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(s)}</div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-title">⚠️ Alertas</div>
          {alertas.length === 0 ? <div className="empty"><span className="empty-icon">🔔</span>Nenhum alerta próximo</div> : alertas.map(a => {
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
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Últimas Movimentações</div>
        {ultimas.length === 0 ? <div className="empty"><span className="empty-icon">💸</span>Nenhuma movimentação</div> : (
          <div className="list">
            {ultimas.map(m => <TxItem key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </ToastProvider>
  )
}

export function TxItem({ m, onDelete }) {
  const isRec = m.tipo === 'receita', isT = m.tipo === 'transferencia'
  const cor = isRec ? 'var(--green)' : isT ? 'var(--sky)' : 'var(--red)'
  return (
    <div className="tx-item">
      <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)`, fontSize: 16 }}>
        {isRec ? '💰' : isT ? '🔄' : '💸'}
      </div>
      <div className="tx-info">
        <div className="tx-name">{m.descricao}</div>
        <div className="tx-meta">
          <span className={`badge ${isRec ? 'badge-green' : isT ? 'badge-blue' : 'badge-red'}`}>{isRec ? 'Receita' : isT ? 'Transf.' : 'Despesa'}</span>
          <span>{m.categoria}</span>
          {m.conta_nome && <span style={{ color: 'var(--text3)' }}>{m.conta_nome}</span>}
        </div>
      </div>
      <div className="tx-right">
        <div className="tx-amount" style={{ color: cor }}>{isRec ? '+' : isT ? '' : '-'}{fmt(m.valor)}</div>
        <div className="tx-date">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
      </div>
      {onDelete && <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(m.id)}>✕</button>}
    </div>
  )
}

export default withAuth(function DashboardPage({ user }) {
  return (
    <Layout title="Dashboard" user={user}>
      <Dashboard user={user} />
    </Layout>
  )
})
