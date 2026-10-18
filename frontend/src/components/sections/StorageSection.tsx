type StorageSectionProps = {
  isActive: boolean
}

export default function StorageSection({ isActive }: StorageSectionProps) {
  return (
    <section id="storage" className={`page placeholder ${isActive ? 'active-page' : ''}`}>
      <div className="page-head">
        <div>
          <div className="eyebrow">INFRASTRUKTUR</div>
          <h1>Penyimpanan Cloud</h1>
          <p>Manajemen berkas cloud dan kapasitas penyimpanan AMBAWAN.</p>
        </div>
      </div>
      <div className="panel empty">
        <div className="empty-icon">☁</div>
        <h2>Cloud Storage</h2>
        <p>Soon...</p>
      </div>
    </section>
  )
}
