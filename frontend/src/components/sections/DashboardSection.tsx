import {
  activityItems,
  criticalItems,
  divisionData,
  lifecycleData,
} from '../../data/mockData'

type DashboardSectionProps = {
  isActive: boolean
  onPrimaryAction: (label: string) => void
}

export default function DashboardSection({ isActive, onPrimaryAction }: DashboardSectionProps) {
  return (
    <section id="dashboard" className={`page ${isActive ? 'active-page' : ''}`}>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            TINJAUAN EKSEKUTIF <span>• Terakhir disinkronisasi: 2 menit lalu</span>
          </div>
          <h1>
            Selamat Pagi, Direktur Wimbuh
            <br />
            Agus Alim
          </h1>
          <p>
            Pantau agregasi beban kerja strategis, efisiensi penugasan lintas direktorat, dan status eskalasi kritis.
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn light">▣ Kuartal II 2025 (Berjalan)</button>
          <button type="button" className="btn light">▤ Unduh Laporan PDF</button>
          <button type="button" className="btn primary" onClick={() => onPrimaryAction('Delegasikan Tugas Baru')}>
            ⊕ Delegasikan Tugas Baru
          </button>
        </div>
      </div>

      <div className="stats four">
        <div className="stat-card">
          <label>TOTAL TUGAS AKTIF</label>
          <strong>
            1.428 <small>Task</small>
          </strong>
          <span className="green">↗ +12,4% MoM</span>
          <small>Target: 1.500</small>
          <div className="progress">
            <i style={{ width: '82%' }} />
          </div>
        </div>

        <div className="stat-card">
          <label>TINGKAT PENYELESAIAN</label>
          <strong className="green">88,6%</strong>
          <span className="pill green-pill">+3,6% Target</span>
          <small>1.265 Selesai QA &nbsp; Target Triwulan 85%</small>
          <div className="ring">89%</div>
        </div>

        <div className="stat-card danger-card">
          <label>TUGAS MELEWATI DEADLINE</label>
          <strong className="red">
            14 <small>Kritis</small>
          </strong>
          <span className="danger-pill">● Waspada Tindakan</span>
          <a href="#tasks">Periksa →</a>
        </div>

        <div className="stat-card">
          <label>EFISIENSI DELEGASI BERJENJANG</label>
          <strong>
            96,2% <small>SLA</small>
          </strong>
          <small>
            Kecepatan Respon Eskalasi: <b>3.2 Jam</b>
          </small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <label>KINERJA DIREKTORAT</label>
                <h2>Progres &amp; Beban Kerja per Divisi</h2>
              </div>
              <span className="tag">5 Divisi Aktif</span>
            </div>
            <div className="division-list">
              {divisionData.map((division) => (
                <div key={division.name}>
                  <div>
                    <b className={`dot ${division.color}`} />
                    {division.name} <span>{division.tasks}</span>
                    <strong>{division.value}%</strong>
                  </div>
                  <div className={`bar ${division.color === 'teal' ? 'tealbar' : division.color === 'gold' ? 'goldbar' : division.color === 'purple' ? 'purplebar' : ''}`}>
                    <i style={{ width: `${division.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel lifecycle">
            <div className="panel-head">
              <div>
                <label>AGREGASI SIKLUS HIDUP</label>
                <h2>Matriks Status Keseluruhan Proyek</h2>
              </div>
              <span>100% Beban Terdistribusi</span>
            </div>
            <div className="segmented">
              {lifecycleData.map((item) => (
                <i key={item.label} style={{ width: item.value }} />
              ))}
            </div>
            <div className="life-cards">
              {lifecycleData.map((item) => (
                <div key={item.label}>
                  <b>{item.label}</b>
                  <strong>{item.number}</strong>
                  <span>{item.value} proyek aktif</span>
                </div>
              ))}
            </div>
            <div className="info-note">
              💡 Bottleneck terdeteksi pada tahapan <b>Review &amp; QA</b> untuk Divisi Rekayasa &amp; IT. <a href="#tasks">Lihat Rekomendasi</a>
            </div>
          </div>
        </div>

        <div>
          <div className="panel critical">
            <div className="panel-head">
              <div>
                <label>⚠ BUTUH INTERVENSI</label>
                <h2>Tugas Kritis &amp; Prioritas Tinggi</h2>
              </div>
              <span className="danger-pill">3 Menunggu Tindakan</span>
            </div>
            {criticalItems.map((item) => (
              <div key={item.code} className="critical-item">
                <div>
                  <b className={item.badgeClass}>{item.badge}</b>
                  <small>{item.code}</small>
                  <span>{item.meta}</span>
                </div>
                <strong>{item.title}</strong>
                <small>
                  {item.owner.includes('Dimas') ? '🔵' : item.owner.includes('Ratih') ? '🟢' : '🔵'} {item.owner} <em>{item.status}</em>
                </small>
              </div>
            ))}
          </div>

          <div className="panel activity">
            <div className="panel-head">
              <div>
                <label>AUDIT BERJENJANG</label>
                <h2>Aktivitas Delegasi Terbaru</h2>
              </div>
              <a href="#tasks">Lihat Semua</a>
            </div>
            {activityItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="activity-item">
                <i>{item.icon}</i>
                <p>
                  <b>{item.title}</b> {item.detail} <b>"{item.project}"</b>.
                  <small>
                    {item.time} · <b>{item.scope}</b>
                  </small>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
