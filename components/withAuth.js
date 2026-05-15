import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export function withAuth(Page) {
  return function AuthPage(props) {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) { router.replace('/login'); return }
        setUser(data.session.user)
        setLoading(false)
      })

      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (!session) router.replace('/login')
        else setUser(session.user)
      })

      return () => sub.subscription.unsubscribe()
    }, [router])

    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13 }}>
        Carregando...
      </div>
    )

    return <Page {...props} user={user} />
  }
}
