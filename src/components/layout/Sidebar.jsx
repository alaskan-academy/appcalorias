import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Utensils, Dumbbell, BookOpen, BarChart2, Settings, Droplets, Zap, ChevronRight, ListTodo, CalendarDays, Scale, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/',            label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/refeicoes',   label: 'Refeições',    icon: Utensils },
  { to: '/exercicios',  label: 'Cardio',        icon: Dumbbell },
  { to: '/treinos',     label: 'Treinos',      icon: ListTodo },
  { to: '/composicao',  label: 'Composição',   icon: Scale },
  { to: '/agua',        label: 'Hidratação',   icon: Droplets },
  { to: '/receitas',    label: 'Receitas',     icon: BookOpen },
  { to: '/calendario',  label: 'Calendário',   icon: CalendarDays },
  { to: '/historico',   label: 'Histórico',    icon: BarChart2 },
  { to: '/config',      label: 'Configurações',icon: Settings },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, signOut } = useAuth()
  const avatar = user?.user_metadata?.avatar_url
  const name   = user?.user_metadata?.full_name ?? user?.email ?? ''
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside
      className="hidden md:flex flex-shrink-0 h-screen sticky top-0 flex-col bg-zinc-950 border-r border-zinc-800/60 py-5 transition-all duration-200"
      style={{ width: collapsed ? 60 : 224 }}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center mb-6 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">NutriTrack</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
        >
          <ChevronRight size={15} className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 px-2 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl transition-all duration-150 text-sm font-medium
               ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
               ${isActive
                 ? 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 hover:text-violet-200'
                 : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className={`px-2 pt-2 border-t border-zinc-800/60 ${collapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'}`}>
        {/* Avatar + name */}
        <div className={`flex items-center rounded-xl p-2 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          {avatar
            ? <img src={avatar} alt={name} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
            : <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-violet-300">{initials}</span>
              </div>
          }
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{name.split(' ')[0]}</p>
              <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={signOut}
          title="Sair"
          className={`flex items-center rounded-xl text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full
            ${collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'}`}
        >
          <LogOut size={14} className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
