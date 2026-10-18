import type { NavItem } from '../../types'

type SidebarProps = {
  navItems: NavItem[]
  currentPage: string
  sidebarOpen: boolean
  onNavigate: (page: string) => void
  onToggle: () => void
}

export default function Sidebar({ navItems, currentPage, sidebarOpen, onNavigate, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
      <div className="brand">
        <div className="brand-mark">✣</div>
        <div>
          <strong>AMBADOR</strong>
          <span>AMBAWAN DEV</span>
        </div>
        <button className="icon-btn sidebar-toggle" type="button" title="Tutup menu" onClick={onToggle}>
          ☰
        </button>
      </div>

      <div className="workspace">
        <div className="tiny-label">ENTITAS KERJA</div>
        <div className="workspace-name">
          AMBAWAN Workspace <span>⌃</span>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-title">MODUL OPERASIONAL</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            data-page={item.id}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sla">
        <div>
          <span>INFRASTRUKTUR SLA</span>
          <b>99.98%</b>
        </div>
        <div className="sla-bar">
          <i />
        </div>
        <div>
          <span>Penyimpanan Terpakai</span>
          <b>14.2 / 50 GB</b>
        </div>
      </div>
    </aside>
  )
}
