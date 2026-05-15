import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { ToastProvider, useToast } from '../components/Toast'
import { withAuth } from '../components/withAuth'
import { addMovimentacao, addCompromisso, getContas, getCategorias } from '../lib/supabase'
import { today } from '../lib/utils'

function AudioPage({ user }) {
  const toast = useToast()
  const [contas, setContas] = useState([])
  const [cats, setCats] = useState([])
  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [modo, setModo] = useState('movimentacao')
  const recRef = useRef(null)

  const [movForm, setMovForm] = useState({ descricao: '', valor: '', tipo_mov: 'despesa', categoria: '', conta: '', data: today() })
  const [compForm, setCompForm] = useState({ titulo: '', tipo_comp: 'reuniao', data: today(), hora: '', valor: '' })

  useEffect(() => {
    Promise.all([getContas(user.id), getCategorias(user.id)]).then(([c, ca]) => {
      setContas(c); setCats(ca)
      setMovForm(f => ({ ...f, categoria: ca[0]?.nome || 'Outros' }))
    })
  }, [user.id])

  function iniciarGravacao() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast('Use o Chrome para reconhecimento de voz.', 'error'); return }
    const r = new SR()
    r.lang = 'pt-BR'; r.continuous = false; r.interimResults = false
    recRef.current = r
    r.onresult = e => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setMovForm(f => ({ ...f, descricao: text }))
      setCompForm(f => ({ ...f, titulo: text }))
      setStatus('done')
    }
    r.onerror = () => { toast('Erro ao capturar áudio. Tente novamente.', 'error'); setStatus('idle') }
    r.start(); setStatus('rec'); setTranscript('')
  }

  function pararGravacao() { recRef.current?.stop(); setStatus('idle') }

  function reset() {
    setStatus('idle'); setTranscript('')
    setMovForm({ descricao: '', valor: '', tipo_mov: 'despesa', categoria: cats[0]?.nome || 'Outros', conta: '', data: today() })
    setCompForm({ titulo: '', tipo_comp: 'reuniao', data: today(), hora: '', valor: '' })
  }

  async function salvarMov() {
    if (!movForm.descricao || !movForm.valor) return toast('Preencha descrição e valor.', 'error')
    try {
      await addMovimentacao(user.id, { descricao: movForm.descricao, valor: parseFloat(movForm.valor), tipo: movForm.tipo_mov, categoria: movForm.categoria || 'Outros', conta_nome: movForm.conta || '', data: movForm.data || today(), observacao: 'Via áudio', via_audio: true })
      toast('Movimentação salva!'); reset()
    } catch { toast('Erro ao salvar.', 'error') }
  }

  async function salvarComp() {
    if (!compForm.titulo || !compForm.data) return toast('Preencha título e data.', 'error')
    try {
      await addCompromisso(user.id, { titulo: compForm.titulo, tipo: compForm.tipo_comp, data: compForm.data || today(), hora: compForm.hora || null, valor: compForm.valor ? parseFloat(compForm.valor) : null, conta_nome: '', recorrencia: 'pontual', dias_alerta: 1, observacao: 'Via áudio', via_audio: true })
      toast('Compromisso salvo!'); reset()
    } catch { toast('Erro ao salvar.', 'error') }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div className="card">
        <div className="card-title">Cadastro por Voz</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
          Grave sua fala, o texto é transcrito automaticamente pelo navegador — sem custo. Revise e salve.
        </p>

        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab${modo === 'movimentacao' ? ' active' : ''}`} onClick={() => setModo('movimentacao')}>💸 Movimentação</button>
          <button className={`tab${modo === 'compromisso' ? ' active' : ''}`} onClick={() => setModo('compromisso')}>📅 Compromisso</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            className={`audio-btn ${status === 'rec' ? 'audio-rec' : 'audio-idle'}`}
            onClick={status === 'rec' ? pararGravacao : iniciarGravacao}
          >
            {status === 'rec' ? '⏹' : '🎤'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            {status === 'idle' && 'Clique para gravar'}
            {status === 'rec' && '🔴 Ouvindo... clique para parar'}
            {status === 'done' && '✅ Transcrição pronta — revise e salve'}
          </div>
        </div>

        {transcript !== '' && (
          <>
            <div className="sdiv">Transcrição</div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 12, fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 16 }}>
              "{transcript}"
            </div>
          </>
        )}

        {modo === 'movimentacao' && (
          <>
            <div className="sdiv">Dados da Movimentação</div>
            <div className="frow">
              <div className="fg" style={{ flex: 2 }}><label>Descrição</label><input value={movForm.descricao} onChange={e => setMovForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Supermercado, Salário..." /></div>
              <div className="fg"><label>Valor (R$)</label><input type="number" step="0.01" min="0" value={movForm.valor} onChange={e => setMovForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" /></div>
              <div className="fg"><label>Tipo</label>
                <select value={movForm.tipo_mov} onChange={e => setMovForm(f => ({ ...f, tipo_mov: e.target.value }))}>
                  <option value="despesa">Despesa</option><option value="receita">Receita</option>
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fg"><label>Categoria</label>
                <select value={movForm.categoria} onChange={e => setMovForm(f => ({ ...f, categoria: e.target.value }))}>
                  {cats.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
                </select>
              </div>
              <div className="fg"><label>Conta</label>
                <select value={movForm.conta} onChange={e => setMovForm(f => ({ ...f, conta: e.target.value }))}>
                  <option value="">Sem conta</option>
                  {contas.map(c => <option key={c.id} value={c.nome}>{c.icon} {c.nome}</option>)}
                </select>
              </div>
              <div className="fg"><label>Data</label><input type="date" value={movForm.data} onChange={e => setMovForm(f => ({ ...f, data: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success" onClick={salvarMov}>✅ Salvar Movimentação</button>
              <button className="btn btn-ghost" onClick={reset}>Limpar</button>
            </div>
          </>
        )}

        {modo === 'compromisso' && (
          <>
            <div className="sdiv">Dados do Compromisso</div>
            <div className="frow">
              <div className="fg" style={{ flex: 2 }}><label>Título</label><input value={compForm.titulo} onChange={e => setCompForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião com cliente..." /></div>
              <div className="fg"><label>Tipo</label>
                <select value={compForm.tipo_comp} onChange={e => setCompForm(f => ({ ...f, tipo_comp: e.target.value }))}>
                  <option value="reuniao">📅 Reunião</option><option value="gasto">💸 Gasto</option>
                  <option value="receita">💰 Recebimento</option><option value="lembrete">🔔 Lembrete</option><option value="outro">📌 Outro</option>
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fg"><label>Data</label><input type="date" value={compForm.data} onChange={e => setCompForm(f => ({ ...f, data: e.target.value }))} /></div>
              <div className="fg"><label>Hora</label><input type="time" value={compForm.hora} onChange={e => setCompForm(f => ({ ...f, hora: e.target.value }))} /></div>
              <div className="fg"><label>Valor (opcional)</label><input type="number" step="0.01" min="0" value={compForm.valor} onChange={e => setCompForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success" onClick={salvarComp}>✅ Salvar Compromisso</button>
              <button className="btn btn-ghost" onClick={reset}>Limpar</button>
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
        <div className="card-title" style={{ marginBottom: 6 }}>💡 Como usar</div>
        <p>1. Escolha o tipo: <strong style={{ color: 'var(--text)' }}>Movimentação</strong> ou <strong style={{ color: 'var(--text)' }}>Compromisso</strong></p>
        <p>2. Clique em 🎤 e fale (ex: <em>"Paguei R$ 80 de academia"</em>)</p>
        <p>3. O texto aparece transcrito e preenche a descrição automaticamente</p>
        <p>4. Complete valor, categoria e data — depois salve</p>
        <p style={{ marginTop: 8, color: 'var(--text3)', fontSize: 11 }}>Funciona no Chrome (Android e desktop) e Safari (iPhone). 100% gratuito — sem API externa.</p>
      </div>
    </div>
  )
}

export default withAuth(function AudioPageWrapper({ user }) {
  return (
    <ToastProvider>
      <Layout title="Cadastro por Voz" user={user}>
        <AudioPage user={user} />
      </Layout>
    </ToastProvider>
  )
})
