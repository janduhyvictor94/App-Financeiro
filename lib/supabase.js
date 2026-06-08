import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============ MOVIMENTAÇÕES ============

export async function getMovimentacoes(userId, filtros = {}) {
  let q = supabase
    .from('movimentacoes')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })

  if (filtros.tipo)      q = q.eq('tipo', filtros.tipo)
  if (filtros.conta)     q = q.eq('conta_nome', filtros.conta)
  if (filtros.categoria) q = q.eq('categoria', filtros.categoria)
  if (filtros.de)        q = q.gte('data', filtros.de)
  if (filtros.ate)       q = q.lte('data', filtros.ate)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addMovimentacao(userId, mov) {
  const { data, error } = await supabase
    .from('movimentacoes')
    .insert({ ...mov, user_id: userId })
    .select()
    .single()
  if (error) throw error
  await registrarHistorico(userId, 'criar', 'movimentacoes', null, data, data.id)
  return data
}

export async function deleteMovimentacao(id, userId) {
  const { data: anterior } = await supabase.from('movimentacoes').select('*').eq('id', id).single()
  const { error } = await supabase.from('movimentacoes').delete().eq('id', id)
  if (error) throw error
  if (anterior && userId) {
    await registrarHistorico(userId, 'deletar', 'movimentacoes', anterior, null, id)
  }
}

// ============ CONTAS ============

export async function getContas(userId) {
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function addConta(userId, conta) {
  const { data, error } = await supabase
    .from('contas')
    .insert({ ...conta, user_id: userId })
    .select()
    .single()
  if (error) throw error
  await registrarHistorico(userId, 'criar', 'contas', null, data, data.id)
  return data
}

export async function updateContaSaldo(id, novoSaldo, userId) {
  const { data: anterior } = await supabase.from('contas').select('*').eq('id', id).single()
  const { data, error } = await supabase
    .from('contas')
    .update({ saldo_inicial: novoSaldo })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (userId) await registrarHistorico(userId, 'editar_saldo', 'contas', anterior, data, id)
  return data
}

export async function deleteConta(id, userId) {
  const { data: anterior } = await supabase.from('contas').select('*').eq('id', id).single()
  const { error } = await supabase.from('contas').delete().eq('id', id)
  if (error) throw error
  if (anterior && userId) await registrarHistorico(userId, 'deletar', 'contas', anterior, null, id)
}

// ============ FUNDOS (aportes/saques) ============

export async function getFundos(userId, contaNome = null) {
  let q = supabase.from('fundos').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (contaNome) q = q.eq('conta_nome', contaNome)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addFundo(userId, fundo) {
  const { data, error } = await supabase
    .from('fundos')
    .insert({ ...fundo, user_id: userId })
    .select()
    .single()
  if (error) throw error
  await registrarHistorico(userId, 'criar', 'fundos', null, data, data.id)
  return data
}

export async function deleteFundo(id, userId) {
  const { data: anterior } = await supabase.from('fundos').select('*').eq('id', id).single()
  const { error } = await supabase.from('fundos').delete().eq('id', id)
  if (error) throw error
  if (anterior && userId) await registrarHistorico(userId, 'deletar', 'fundos', anterior, null, id)
}

// ============ CATEGORIAS ============

export async function getCategorias(userId) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('user_id', userId)
    .order('nome')
  if (error) throw error
  return data
}

export async function addCategoria(userId, cat) {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ ...cat, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategoria(id) {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}

// ============ COMPROMISSOS ============

export async function getCompromissos(userId) {
  const { data, error } = await supabase
    .from('compromissos')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: true })
  if (error) throw error
  return data
}

export async function addCompromisso(userId, comp) {
  const { data, error } = await supabase
    .from('compromissos')
    .insert({ ...comp, user_id: userId })
    .select()
    .single()
  if (error) throw error
  await registrarHistorico(userId, 'criar', 'compromissos', null, data, data.id)
  return data
}

export async function deleteCompromisso(id, userId) {
  const { data: anterior } = await supabase.from('compromissos').select('*').eq('id', id).single()
  const { error } = await supabase.from('compromissos').delete().eq('id', id)
  if (error) throw error
  if (anterior && userId) await registrarHistorico(userId, 'deletar', 'compromissos', anterior, null, id)
}

// ============ HISTÓRICO E DESFAZER ============

async function registrarHistorico(userId, acao, tabela, dadosAnteriores, dadosNovos, registroId) {
  try {
    await supabase.from('historico_acoes').insert({
      user_id: userId,
      acao,
      tabela,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos,
      registro_id: registroId,
    })
  } catch (e) { console.error('Erro ao registrar histórico:', e) }
}

export async function ultimaAcao(userId) {
  const { data, error } = await supabase
    .from('historico_acoes')
    .select('*')
    .eq('user_id', userId)
    .eq('desfeita', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function desfazerUltima(userId) {
  const ultima = await ultimaAcao(userId)
  if (!ultima) throw new Error('Nada para desfazer')

  if (ultima.acao === 'criar') {
    await supabase.from(ultima.tabela).delete().eq('id', ultima.registro_id)
  } else if (ultima.acao === 'deletar') {
    await supabase.from(ultima.tabela).insert(ultima.dados_anteriores)
  } else if (ultima.acao === 'editar_saldo') {
    await supabase.from('contas').update({ saldo_inicial: ultima.dados_anteriores.saldo_inicial }).eq('id', ultima.registro_id)
  }

  await supabase.from('historico_acoes').update({ desfeita: true }).eq('id', ultima.id)
  return ultima
}