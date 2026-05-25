import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Utensils, Dumbbell, Droplets, Grid3x3, X,
  Scale, BookOpen, CalendarDays, BarChart2, Settings, ListTodo,
} from 'lucide-react'

const MAIN_TABS = [
  { to: '/',           label: 'Início',    icon: LayoutDashboard },
  { to: '/refeicoes',  label: 'Refeições', icon: Utensils },
  { to: '/exercicios', label: 'Cardio',    icon: Dumbbell },
  { to: '/agua',       label: 'Água',      icon: Droplets },
]

const MORE_LINKS = [
  { to: '/treinos',    label: 'Treinos',       icon: ListTodo },
  { to: '/composicao', label: 'Composição',    icon: Scale },
  { to: '/receitas',   label: 'Receitas',      icon: BookOpen },
  { to: '/calendario', label: 'Calendário',    icon: CalendarDays },
  { to: '/historico',  label: 'Histórico',     icon: BarChart2 },
  { to: '/config',     label: 'Configurações', icon: Settings },
]

export default function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const navigate = useNavigate()

  function handleMoreLink(to) {
    setSheetOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Bottom tab bar — only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950/95 backdrop-blur border-t border-zinc-800 flex h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {MAIN_TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                isActive ? 'text-violet-400' : 'text-zinc-500'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 text-zinc-500 transition-colors"
        >
          <Grid3x3 size={20} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      {/* Slide-up sheet for extra links */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-5 pb-10">
            {/* Handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Menu</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE_LINKS.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => handleMoreLink(to)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 hover:bg-violet-600/5 transition-colors"
                >
                  <Icon size={20} className="text-violet-400" />
                  <span className="text-xs text-zinc-300 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
