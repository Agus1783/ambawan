import { auditRows, managerList } from '../../data/mockData'

type StructureSectionProps = {
  isActive: boolean
}

export default function StructureSection({ isActive }: StructureSectionProps) {
  return (
    <section id="structure" className={`page ${isActive ? 'active-page' : ''}`}>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            TATA KELOLA KORPORAT / <b>STRUKTUR &amp; DELEGASI BERJENJANG</b>
          </div>
          <h1>
            Topologi Delegasi &amp;
            <br />
            Tata Kelola Otoritas
          </h1>
        </div>
        <div className="head-actions">
          <span className="audit-badge">
            AUDIT AKTIF
            <br />
            V4.2
          </span>
          <button type="button" className="btn light">⌘ Bagan Pohon Delegasi</button>
          <button type="button" className="btn light">▦ Matriks Unit Kerja Divisi</button>
          <button type="button" className="btn primary">⊕ Delegasikan Mandat Baru</button>
        </div>
      </div>

      <div className="stats four">
        <div className="stat-card">
          <label>RASIO RANTAI KOMANDO</label>
          <strong>1 : 3 : 33</strong>
          <span className="green">⚙ Terdistribusi Seimbang</span>
        </div>
        <div className="stat-card">
          <label>MANDAT TERDELEGASI AKTIF</label>
          <strong>81</strong>
          <small>
            Penugasan
            <br />
            3 Direktori Strategis
          </small>
        </div>
        <div className="stat-card">
          <label>INDEKS BEBAN KERJA RATA-RATA</label>
          <strong className="gold">84.2%</strong>
          <span className="gold-text">Kapasitas Optimal</span>
        </div>
        <div className="stat-card">
          <label>INTEGRITAS AUDIT TRAIL</label>
          <strong className="green">100% Valid</strong>
          <small>
            Timestamp Kriptografis
            <br />
            SHA-256
          </small>
        </div>
      </div>

      <div className="panel tree-panel">
        <div className="legend">
          <span>● Beban Normal (&lt;75%)</span>
          <span>● Beban Optimal (75-90%)</span>
          <span className="red-text">● Beban Kritis / Overload (&gt;90%)</span>
        </div>
        <div className="tree-root">
          <div className="person">
            <div className="person-avatar">WA</div>
            <div>
              <label>EXECUTIVE LEADER · Direksi</label>
              <strong>Wimbuh Agus Alim</strong>
              <small>Direktur Utama Operasional</small>
            </div>
            ⋮
          </div>
        </div>
        <div className="tree-children">
          {managerList.map((manager) => (
            <div key={manager.name} className="manager">
              <label>{manager.label}</label>
              <strong>{manager.name}</strong>
              <small>{manager.subtitle}</small>
              <div className="mini-metrics">
                <span>
                  Kekuatan Tim <b>{manager.strength}</b>
                </span>
                <span>
                  Tugas Aktif <b>{manager.activeTasks}</b>
                </span>
              </div>
              <div className="load">
                <span>
                  Beban Divisi <b>{manager.load}</b>
                </span>
                <i style={{ width: `${manager.loadValue}%` }} />
              </div>
              <div className="members">
                {manager.members.map((member) => (
                  <span key={member.name}>
                    {member.name}
                    <small>{member.description}</small>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel audit-table">
        <div className="panel-head">
          <div>
            <label>◉</label>
            <h2>Tabel Jejak Audit &amp; Riwayat Otoritas Delegasi</h2>
            <p>Log kronologis perubahan wewenang, pemindahan mandat tugas, dan konfirmasi penerimaan operasional.</p>
          </div>
          <button type="button" className="btn light">☷ Semua Status Verifikasi</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>TIMESTAMP &amp; REF ID</th>
              <th>PEMBERI DELEGASI</th>
              <th>PENERIMA MANDAT</th>
              <th>DESKRIPSI MANDAT / PERUBAHAN WEWENANG</th>
              <th>TINGKAT</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.map((row, index) => (
              <tr key={`${row[1]}-${index}`}>
                <td>
                  <b>{row[0]}</b>
                  <small>{row[1]}</small>
                </td>
                <td>
                  {row[2]}
                  <small>Direktur Operasional</small>
                </td>
                <td>
                  {row[3]}
                  <small>Div. Rekayasa Lunak</small>
                </td>
                <td>
                  {row[4]}
                  <small>SLA Eksekusi: 72 Jam kerja</small>
                </td>
                <td>{row[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
