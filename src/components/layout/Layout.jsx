import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import FAB from '../ui/FAB'
import PullToRefresh from '../ui/PullToRefresh'

const FAB_ROUTES = ['/', '/refeicoes', '/agua']

export default function Layout() {
  const [collapsed, setCollapsed] = useState(true)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>
      {FAB_ROUTES.includes(pathname) && <FAB />}
      <MobileNav />
      <PullToRefresh />
    </div>
  )
}
