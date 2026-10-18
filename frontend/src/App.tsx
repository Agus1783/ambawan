import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import DashboardSection from './components/sections/DashboardSection'
import RbacSection from './components/sections/RbacSection'
import StorageSection from './components/sections/StorageSection'
import StructureSection from './components/sections/StructureSection'
import TasksSection from './components/sections/TasksSection'
import { navItems } from './data/mockData'
import { showDemoAlert } from './utils/demoActions'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    return window.location.hash.replace('#', '') || 'dashboard'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleHashChange = () => {
      const next = window.location.hash.replace('#', '')
      if (next && document.getElementById(next)) {
        setCurrentPage(next)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId)
    setSidebarOpen(false)
    window.history.replaceState(null, '', `#${pageId}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrimaryAction = (label: string) => {
    showDemoAlert(label)
  }

  return (
    <div className="app">
      <Sidebar
        navItems={navItems}
        currentPage={currentPage}
        sidebarOpen={sidebarOpen}
        onNavigate={handleNavigate}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <main className="main">
        <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <DashboardSection
          isActive={currentPage === 'dashboard'}
          onPrimaryAction={handlePrimaryAction}
        />

        <TasksSection
          isActive={currentPage === 'tasks'}
          onPrimaryAction={handlePrimaryAction}
        />

        <StructureSection isActive={currentPage === 'structure'} />

        <RbacSection
          isActive={currentPage === 'rbac'}
          onPrimaryAction={handlePrimaryAction}
        />

        <StorageSection isActive={currentPage === 'storage'} />
      </main>
    </div>
  )
}

export default App
