export const fmt = (v) =>
  'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const today = () => new Date().toISOString().split('T')[0]

export const parseLocalDate = (str) => new Date(str + 'T12:00:00')

export const diffDays = (dateStr) => {
  const d = parseLocalDate(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((d - now) / 86400000)
}

export const calcSaldoConta = (conta, movimentacoes) => {
  const base = Number(conta.saldo_inicial) || 0
  const fromMovs = movimentacoes
    .filter((m) => m.conta_nome === conta.nome)
    .reduce((a, m) => (m.tipo === 'receita' ? a + Number(m.valor) : a - Number(m.valor)), 0)
  return base + fromMovs
}

export const calcPatrimonio = (contas, movimentacoes) =>
  contas.reduce((total, c) => total + calcSaldoConta(c, movimentacoes), 0)

export const mesAtual = () => {
  const now = new Date()
  return { mes: now.getMonth(), ano: now.getFullYear() }
}

export const filtrarMes = (movs, mes, ano) =>
  movs.filter((m) => {
    const d = parseLocalDate(m.data)
    return d.getMonth() === mes && d.getFullYear() === ano
  })

export const somaReceitas = (movs) =>
  movs.filter((m) => m.tipo === 'receita').reduce((a, m) => a + Number(m.valor), 0)

export const somaDespesas = (movs) =>
  movs.filter((m) => m.tipo === 'despesa').reduce((a, m) => a + Number(m.valor), 0)

export const alertasProximos = (compromissos) => {
  return compromissos.filter((c) => {
    const diff = diffDays(c.data)
    return diff >= 0 && diff <= (Number(c.dias_alerta) || 1)
  })
}

export const TIPO_ICON = {
  reuniao: '📅',
  gasto: '💸',
  receita: '💰',
  lembrete: '🔔',
  outro: '📌',
}

export const TIPO_COR = {
  reuniao: '#0ea5e9',
  gasto: '#f43f5e',
  receita: '#10b981',
  lembrete: '#f59e0b',
  outro: '#8892b0',
}
