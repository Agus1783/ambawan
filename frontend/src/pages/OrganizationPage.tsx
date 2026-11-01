// Halaman Organisasi mockup: kartu divisi + tabel anggota dengan role (RBAC).
import { ROLE_LABELS, divisionName, divisions, userName, users } from '../data/mockData';
import { Chip } from '../components/mockup/Chip';
import {
  cardClass,
  grid3Class,
  mutedClass,
  sectionTitleClass,
  stackClass,
  tableTdClass,
  tableThClass,
} from '../components/mockup/UiClasses';

export function OrganizationPage() {
  return (
    <div className={stackClass}>
      <div className={grid3Class}>
        {divisions.map((d) => (
          <div className={cardClass} key={d.id}>
            <h3 className={`${sectionTitleClass} m-0`}>Divisi {d.name}</h3>
            <p className={mutedClass}>Ketua: {userName(d.leaderId)}</p>
            <p className={mutedClass}>{users.filter((u) => u.divisionId === d.id).length} anggota</p>
          </div>
        ))}
      </div>

      <div className={`${cardClass} p-0 overflow-hidden`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableThClass}>Nama</th>
              <th className={tableThClass}>Email</th>
              <th className={tableThClass}>Role</th>
              <th className={tableThClass}>Divisi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className={tableTdClass}><strong>{u.name}</strong></td>
                <td className={tableTdClass}>{u.email}</td>
                <td className={tableTdClass}>
                  <Chip className={u.role === 'ADMIN' ? 'bg-mk-red-soft' : u.role === 'MANAGER' ? 'bg-mk-yellow-soft' : u.role === 'DIVISION_LEADER' ? 'bg-mk-blue-soft' : ''}>
                    {ROLE_LABELS[u.role]}
                  </Chip>
                </td>
                <td className={tableTdClass}>{divisionName(u.divisionId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
