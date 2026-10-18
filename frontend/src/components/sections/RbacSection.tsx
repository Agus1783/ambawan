import { directoryRows, permissionMatrix, roleCards } from '../../data/mockData'

type RbacSectionProps = {
  isActive: boolean
  onPrimaryAction: (label: string) => void
}

export default function RbacSection({ isActive, onPrimaryAction }: RbacSectionProps) {
  return (
    <section id="rbac" className={`page ${isActive ? 'active-page' : ''}`}>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            KEAMANAN &amp; TATA KELOLA <span>• Auth Protokol: JWT RS256 / 4096-bit</span>
          </div>
          <h1>
            Kelola Pengguna, Peran &amp; Hak Akses
            <br />
            Berjenjang
          </h1>
          <p>Pusat otorisasi tingkat lanjut, tata kelola kontrol akses berbasis peran (RBAC), siklus hidup token JWT, dan validasi izin operasional seluruh entitas kerja.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn light">◌ Ekspor Log Audit</button>
          <button type="button" className="btn light">▣ Konfigurasi Kebijakan JWT</button>
          <button type="button" className="btn primary" onClick={() => onPrimaryAction('Pengguna Baru')}>
            ⊕ Tambah Pengguna Baru
          </button>
        </div>
      </div>

      <div className="rbac-roles">
        {roleCards.map((role) => (
          <div key={role.level} className={`role-card ${role.accent}`}>
            <label>{role.level}</label>
            <h3>{role.title}</h3>
            <strong>
              {role.count} <small>{role.subtitle}</small>
            </strong>
            <p>{role.text}</p>
            <b>AKSES PENUH 100% →</b>
          </div>
        ))}
      </div>

      <div className="rbac-grid">
        <div className="panel permission">
          <div className="panel-head">
            <div>
              <label>HIERARKI KONTROL OTORISASI</label>
              <h2>Matriks Hak Akses (Permission Matrix)</h2>
            </div>
            <span className="tag green-tag">● Live Enforcement: Active</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>MODUL &amp; BATASAN IZIN</th>
                <th>ADMINISTRATOR</th>
                <th>MANAGER</th>
                <th>KETUA DIVISI</th>
                <th>ANGGOTA</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((row, index) => (
                <tr key={`${row[0]}-${index}`}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                  <td>{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel jwt">
          <label>PEMANTAUAN KRIPTOGRAFI</label>
          <h2>Validasi JWT &amp; Keamanan Sesi</h2>
          <div className="jwt-box">
            <span>
              Masa Berlaku Access Token <b>60 Menit</b>
            </span>
            <div className="progress">
              <i style={{ width: '70%' }} />
            </div>
            <span>
              Refresh Token Rotation <b className="green">Diaktifkan</b>
            </span>
          </div>
          <p>✓ Enkripsi Payloads: JWE AES-256-GCM</p>
          <p>✓ Pencegahan Token Replay Otomatis</p>
          <p>✓ Blokir IP Anomali Berkelanjutan</p>
          <button type="button" className="btn danger">◉ Revoke Semua Sesi Aktif</button>
        </div>
      </div>

      <div className="panel directory">
        <div className="panel-head">
          <div>
            <label>KATALOG ENTITAS</label>
            <h2>
              Direktori Pengguna &amp;
              <br />
              Status Token
            </h2>
          </div>
          <div className="directory-filters">
            <input placeholder="⌕ Cari nama atau email..." />
            <button type="button">Semua Peran</button>
            <button type="button">Semua Divisi</button>
            <button type="button">Status Akun</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>PROFIL PENGGUNA</th>
              <th>DIVISI</th>
              <th>PERAN (RBAC)</th>
              <th>VALIDITAS JWT &amp; LOGIN</th>
              <th>2FA</th>
              <th>AKSI PENGELOLAAN</th>
            </tr>
          </thead>
          <tbody>
            {directoryRows.map((row) => (
              <tr key={row.email}>
                <td>
                  <b className={`circle ${row.accent}`}>{row.initials}</b>
                  <strong>{row.name}</strong>
                  <small>{row.email}</small>
                </td>
                <td>{row.division}</td>
                <td>
                  <span className={row.roleClass}>{row.role}</span>
                </td>
                <td>
                  {row.tokenStatus}
                  <br />
                  <b className={row.statusClass || 'green'}>{row.validity}</b>
                </td>
                <td>
                  <span className={row.twoFa === 'AKTIF' ? 'green-pill' : row.twoFa === 'NON-AKTIF' ? 'gray-pill' : 'green-pill'}>{row.twoFa}</span>
                </td>
                <td>☷ · ⋯ · ⛓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
