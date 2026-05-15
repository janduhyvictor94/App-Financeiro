import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

const NAV = [
  { href: '/dashboard',      label: 'Dashboard',      icon: IconDash },
  { href: '/movimentacoes',  label: 'Movimentações',  icon: IconMov },
  { href: '/audio',          label: 'Áudio',          icon: IconMic },
  { href: '/contas',         label: 'Contas',         icon: IconBank },
  { href: '/compromissos',   label: 'Compromissos',   icon: IconCal },
  { href: '/categorias',     label: 'Categorias',     icon: IconTag },
  { href: '/relatorio',      label: 'Relatório',      icon: IconReport },
]

// Mobile bottom nav — only 5 most used
const BOT_NAV = [
  { href: '/dashboard',     label: 'Início',     icon: IconDash },
  { href: '/movimentacoes', label: 'Lançar',     icon: IconMov },
  { href: '/audio',         label: 'Áudio',      icon: IconMic },
  { href: '/compromissos',  label: 'Agenda',     icon: IconCal },
  { href: '/relatorio',     label: 'Relatório',  icon: IconReport },
]

export default function Layout({ children, title, user }) {
  const router = useRouter()
  const toast = useToast()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-logo">
          <div className="logo-mark">💰</div>
          FinançasPRO
        </Link>
        <nav className="sidebar-nav">
          {NAV.map((n) => {
            const active = router.pathname === n.href
            return (
              <Link key={n.href} href={n.href} className={`nav-item${active ? ' active' : ''}`}>
                <n.icon />
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={logout} title="Sair">
              <IconLogout />
            </button>
          </div>
          <div className="pwa-tip">
            <strong>📱 Instalar no celular</strong>
            Chrome → Menu → "Adicionar à tela inicial"
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <span style={{ fontSize: 11, color: 'var(--text3)' }} className="hide-mobile">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <div className="user-avatar show-mobile" onClick={logout} title="Sair">{initials}</div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="bottomnav">
        <div className="bottomnav-inner">
          {BOT_NAV.map((n) => {
            const active = router.pathname === n.href
            return (
              <button key={n.href} className={`bn-item${active ? ' active' : ''}`} onClick={() => router.push(n.href)}>
                <n.icon />
                <span>{n.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <style jsx>{`
        .hide-mobile { display: block; }
        .show-mobile { display: none; }
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .show-mobile { display: flex; }
        }
      `}</style>
    </div>
  )
}

// ---- SVG Icons (inline, no dependency) ----
function IconDash() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function IconMov() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
}
function IconMic() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
}
function IconBank() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>
}
function IconCal() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function IconTag() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
}
function IconReport() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
function IconLogout() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
