type TopbarProps = {
  onToggleSidebar: () => void
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="mobile-menu" type="button" id="mobileMenu" onClick={onToggleSidebar}>
        ☰
      </button>
      <div className="search">
        ⌕ <input placeholder="Cari proyek, delegasi direktori, audit ID..." />
      </div>
      <div className="top-actions">
        <span className="notification">
          ♧<i />
        </span>
        <span>?</span>
        <div className="user">
          <div>
            <strong>Arya Daniswara</strong>
            <small>Administrator</small>
          </div>
          <div className="avatar">A</div>
        </div>
      </div>
    </header>
  )
}
