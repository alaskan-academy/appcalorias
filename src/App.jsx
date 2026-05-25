import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Refeicoes from './pages/Refeicoes'
import Exercicios from './pages/Exercicios'
import Agua from './pages/Agua'
import Receitas from './pages/Receitas'
import Historico from './pages/Historico'
import Config from './pages/Config'
import Treinos from './pages/Treinos'
import Calendario from './pages/Calendario'
import Composicao from './pages/Composicao'
import { Zap } from 'lucide-react'

// ─── Loading screen shown while checking auth / pulling from Supabase ──────────
function SyncLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center animate-pulse">
        <Zap size={22} className="text-white" />
      </div>
      <p className="text-sm text-zinc-500">Carregando seus dados…</p>
    </div>
  )
}

// ─── Routes (rendered only after auth + sync are ready) ────────────────────────
function AppRoutes() {
  const { profile } = useApp()

  if (!profile) return <Onboarding />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/refeicoes"  element={<Refeicoes />}  />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/agua"       element={<Agua />}       />
          <Route path="/receitas"   element={<Receitas />}   />
          <Route path="/historico"  element={<Historico />}  />
          <Route path="/treinos"    element={<Treinos />}    />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/composicao" element={<Composicao />} />
          <Route path="/config"     element={<Config />}     />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// ─── Shell: decides what to render based on auth state ─────────────────────────
function AppShell() {
  const { user, loading, synced } = useAuth()

  if (loading || (user && !synced)) return <SyncLoading />
  if (!user)                        return <Login />

  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

// ─── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
