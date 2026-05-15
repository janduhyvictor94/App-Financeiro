import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- helpers tipados ----

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
  return data
}

export async function deleteMovimentacao(id) {
  const { error } = await supabase.from('movimentacoes').delete().eq('id', id)
  if (error) throw error
}

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
  return data
}

export async function deleteConta(id) {
  const { error } = await supabase.from('contas').delete().eq('id', id)
  if (error) throw error
}

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
  return data
}

export async function deleteCompromisso(id) {
  const { error } = await supabase.from('compromissos').delete().eq('id', id)
  if (error) throw error
}
