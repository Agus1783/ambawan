import { taskRows } from '../../data/mockData'

type TasksSectionProps = {
  isActive: boolean
  onPrimaryAction: (label: string) => void
}

export default function TasksSection({ isActive, onPrimaryAction }: TasksSectionProps) {
  return (
    <section id="tasks" className={`page ${isActive ? 'active-page' : ''}`}>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            OPERASIONAL / <b>DIREKTORAT TEKNOLOGI &amp; INFRASTRUKTUR</b>
          </div>
          <h1>
            Manajemen Proyek &amp; Task
            <br />
            Board
          </h1>
          <p>Sistem delegasi terstruktur, pelacakan tiket bertingkat, dan sinkronisasi berkas Cloud.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn light">▤ Tabel Data</button>
          <button type="button" className="btn light">▥ Kanban Board</button>
          <button type="button" className="btn light">⇩ Ekspor CSV</button>
          <button type="button" className="btn primary" onClick={() => onPrimaryAction('Tugas Baru')}>
            ⊕ Buat Tugas Baru
          </button>
        </div>
      </div>

      <div className="stats four">
        <div className="stat-card">
          <label>TUGAS AKTIF</label>
          <strong>184</strong>
          <span className="green">↑ 12 tugas</span>
          <small>minggu ini</small>
        </div>
        <div className="stat-card">
          <label>REVIEW KADIV</label>
          <strong className="gold">29</strong>
          <small>Memerlukan otorisasi</small>
        </div>
        <div className="stat-card">
          <label>SELESAI BULAN INI</label>
          <strong className="green">620</strong>
          <span className="green">94.8% SLA Terpenuhi</span>
        </div>
        <div className="stat-card">
          <label>BERKAS CLOUD TERKAIT</label>
          <strong className="blue-text">1,429</strong>
          <small>
            Supabase S3
            <br />
            Encrypted
          </small>
        </div>
      </div>

      <div className="filter-panel">
        <div className="filter-search">
          ⌕ <input placeholder="Cari judul task, kode tiket (#TSK), atau deskripsi..." />
        </div>
        <div className="chips">
          <span>
            Filter Aktif: <b>IT &amp; Security ×</b> <b>Prioritas: Tinggi ×</b> <a href="#tasks">Reset</a>
          </span>
        </div>
        <div className="filter-row">
          <select defaultValue="In Progress">
            <option>Status: In Progress</option>
          </select>
          <select defaultValue="Tinggi (Kritis)">
            <option>Prioritas: Tinggi (Kritis)</option>
          </select>
          <select defaultValue="IT & Security">
            <option>Divisi: IT &amp; Security</option>
          </select>
          <select defaultValue="Penanggung Jawab: Semua PIC">
            <option>Penanggung Jawab: Semua PIC</option>
          </select>
          <select defaultValue="Rentang Deadline: 7 Hari Kedepan">
            <option>Rentang Deadline: 7 Hari Kedepan</option>
          </select>
        </div>
      </div>

      <div className="task-layout">
        <div className="panel task-table">
          <div className="task-row head">
            <span>□</span>
            <span>ID TIKET</span>
            <span>JUDUL PROYEK &amp; TUGAS</span>
            <span>DIVISI</span>
          </div>
          {taskRows.map((task) => (
            <div key={task.id} className="task-row">
              <span>□</span>
              <b>{task.id}</b>
              <span>
                <strong>{task.title}</strong>
                <small>{task.subtitle}</small>
              </span>
              <span>{task.division}</span>
            </div>
          ))}
        </div>

        <aside className="task-detail">
          <div className="detail-top">
            <b>#TSK-842</b>
            <span>Prioritas Tinggi</span>
          </div>
          <label>TIKET OPERASIONAL</label>
          <h2>Implementasi Enkripsi Database Medis &amp; JWT Auth</h2>
          <p>
            Penyelarasan enkripsi kolom tabel rekam medis pasien sesuai standar kepatuhan regulasi Kementerian Kesehatan serta pembaruan token rotasi HMAC SHA-256.
          </p>
          <div className="account-box">
            <b>STRUKTUR AKUNTABILITAS &amp; DELEGASI</b>
            <div>
              <span>
                Pemberi Delegasi (Accountable)
                <strong>Bpk. Hendra (Kadiv IT)</strong>
              </span>
              <span>
                Pelaksana (Responsible)
                <strong>Fadhil Rahman (Lead Sec)</strong>
              </span>
              <span>
                Konsultan (Consulted)
                <strong>dr. Tirta (Ops Medis)</strong>
              </span>
              <span>
                Target Selesai
                <strong className="red">24 Okt 2024 (2 Hari)</strong>
              </span>
            </div>
          </div>
          <h3>
            ☷ Checklist Sub-tugas <span className="tag">4/5 Selesai (80%)</span>
          </h3>
          <div className="progress">
            <i style={{ width: '80%' }} />
          </div>
          <ul className="checklist">
            <li>☑ Pembukaan skema rotasi KMS &amp; Vault key</li>
            <li>☑ Benchmark throughput query tabel riwayat_pasien</li>
            <li>☑ Sanitasi input parameter token JWT pada middleware API</li>
            <li>☑ Penerapan masking data PHI pada staging env</li>
            <li>□ Pengujian penetrasi eksternal oleh auditor independen</li>
          </ul>
          <div className="detail-actions">
            <button type="button" className="btn primary">◉ Setujui &amp; Teruskan</button>
            <button type="button" className="btn light">← Kembalikan</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
