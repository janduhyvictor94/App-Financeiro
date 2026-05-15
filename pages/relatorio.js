import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { getMovimentacoes, getContas } from '../lib/supabase'
import { fmt, today, calcSaldoConta, calcPatrimonio, somaReceitas, somaDespesas } from '../lib/utils'

function RelPage({ user }) {
  const toast = useToast()
  const [movs, setMovs] = useState([])
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)

  const now = new Date()
  const [de, setDe] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
  const [ate, setAte] = useState(today())
  const [contaFiltro, setContaFiltro] = useState('')

  useEffect(() => {
    Promise.all([getMovimentacoes(user.id), getContas(user.id)]).then(([m, c]) => {
      setMovs(m); setContas(c); setLoading(false)
    })
  }, [user.id])

  function gerar() {
    const from = new Date(de + 'T00:00:00')
    const to = new Date(ate + 'T23:59:59')
    let list = movs.filter(m => { const d = new Date(m.data + 'T12:00:00'); return d >= from && d <= to })
    if (contaFiltro) list = list.filter(m => m.conta_nome === contaFiltro)

    const rec = somaReceitas(list)
    const desp = somaDespesas(list)
    const catMap = {}
    list.filter(m => m.tipo === 'despesa').forEach(m => { catMap[m.categoria] = (catMap[m.categoria] || 0) + Number(m.valor) })

    setReport({ list, rec, desp, saldo: rec - desp, catMap })
  }

  function exportCSV() {
    if (!report) return
    let csv = 'Data,Descrição,Tipo,Categoria,Conta,Valor,Observação\n'
    report.list.forEach(m => { csv += `${m.data},"${m.descricao}",${m.tipo},${m.categoria},${m.conta_nome || ''},${m.valor},"${m.observacao || ''}"\n` })
    dl(csv, `financas_${de}_${ate}.csv`, 'text/csv')
  }

  function exportTXT() {
    if (!report) return
    let txt = `RELATÓRIO FINANCEIRO — FinançasPRO\n${'='.repeat(50)}\n`
    txt += `Período: ${new Date(de + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(ate + 'T12:00:00').toLocaleDateString('pt-BR')}\n`
    if (contaFiltro) txt += `Conta: ${contaFiltro}\n`
    txt += `\nRESUMO\n${'-'.repeat(30)}\n`
    txt += `Receitas:  ${fmt(report.rec)}\nDespesas:  ${fmt(report.desp)}\nSaldo:     ${fmt(report.saldo)}\n`
    txt += `\nSALDO POR CONTA\n${'-'.repeat(30)}\n`
    contas.forEach(c => { txt += `${c.nome}: ${fmt(calcSaldoConta(c, movs))}\n` })
    txt += `\nGASTOS POR CATEGORIA\n${'-'.repeat(30)}\n`
    Object.entries(report.catMap).sort((a, b) => b[1] - a[1]).forEach(([cat, v]) => { txt += `${cat}: ${fmt(v)}\n` })
    txt += `\nMOVIMENTAÇÕES (${report.list.length})\n${'-'.repeat(50)}\n`
    report.list.forEach(m => {
      txt += `${new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')} | ${m.tipo.padEnd(12)} | ${(m.conta_nome || '—').padEnd(14)} | ${m.categoria.padEnd(14)} | ${fmt(m.valor).padStart(12)} | ${m.descricao}\n`
    })
    dl(txt, `financas_${de}_${ate}.txt`, 'text/plain')
    toast('📄 Relatório TXT exportado!')
  }

  function dl(content, name, type) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + content], { type: type + ';charset=utf-8' }))
    a.download = name; a.click()
    toast('📥 Exportado com sucesso!')
  }

  if (loading) return <div className="empty">Carregando...</div>

  return (
    <>
      <div className="card">
        <div className="card-title">
          Configurar Relatório
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="date" value={de} onChange={e => setDe(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }} />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>até</span>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }} />
            <select value={contaFiltro} onChange={e => setContaFiltro(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '5px 8px', color: 'var(--text)', fontSize: 12 }}>
              <option value="">Todas as contas</option>
              {contas.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={gerar}>📊 Gerar</button>
            {report && <>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ CSV</button>
              <button className="btn btn-amber btn-sm" onClick={exportTXT}>📄 TXT</button>
            </>}
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="g3">
            <div className="metric"><div className="metric-label">Receitas</div><div className="metric-value" style={{ color: 'var(--green)' }}>{fmt(report.rec)}</div><div className="metric-sub">{report.list.filter(m => m.tipo === 'receita').length} lançamentos</div></div>
            <div className="metric"><div className="metric-label">Despesas</div><div className="metric-value" style={{ color: 'var(--red)' }}>{fmt(report.desp)}</div><div className="metric-sub">{report.list.filter(m => m.tipo === 'despesa').length} lançamentos</div></div>
            <div className="metric"><div className="metric-label">Saldo</div><div className="metric-value" style={{ color: report.saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(report.saldo)}</div><div className="metric-sub">{report.saldo >= 0 ? '✅ Positivo' : '❌ Negativo'}</div></div>
          </div>

          <div className="g2">
            <div className="card">
              <div className="card-title">Gastos por Categoria</div>
              {Object.keys(report.catMap).length === 0
                ? <div className="empty">Sem despesas no período</div>
                : Object.entries(report.catMap).sort((a, b) => b[1] - a[1]).map(([cat, v]) => {
                  const pct = report.desp > 0 ? Math.round(v / report.desp * 100) : 0
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{cat}</span>
                        <span style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(v)} ({pct}%)</span>
                      </div>
                      <div className="progress"><div className="progress-bar" style={{ width: `${pct}%`, background: 'var(--red)' }} /></div>
                    </div>
                  )
                })
              }
            </div>

            <div className="card">
              <div className="card-title">Saldo por Conta</div>
              {contas.map(c => {
                const s = calcSaldoConta(c, movs)
                return (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{c.icon} {c.nome}</span>
                    <span style={{ fontWeight: 600, color: s >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(s)}</span>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 14, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: calcPatrimonio(contas, movs) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(calcPatrimonio(contas, movs))}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Movimentações do Período ({report.list.length})</div>
            {report.list.length === 0
              ? <div className="empty">Sem movimentações no período</div>
              : <div className="list">
                {report.list.map(m => {
                  const isRec = m.tipo === 'receita'
                  const cor = isRec ? 'var(--green)' : 'var(--red)'
                  return (
                    <div key={m.id} className="tx-item">
                      <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)` }}>{isRec ? '💰' : '💸'}</div>
                      <div className="tx-info">
                        <div className="tx-name">{m.descricao}</div>
                        <div className="tx-meta"><span>{m.categoria}</span>{m.conta_nome && <span style={{ color: 'var(--text3)' }}>{m.conta_nome}</span>}</div>
                      </div>
                      <div className="tx-right">
                        <div className="tx-amount" style={{ color: cor }}>{isRec ? '+' : '-'}{fmt(m.valor)}</div>
                        <div className="tx-date">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            }
          </div>
        </>
      )}
    </>
  )
}

export default withAuth(function RelPageWrapper({ user }) {
  return (
    <ToastProvider>
      <Layout title="Relatório" user={user}>
        <RelPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
