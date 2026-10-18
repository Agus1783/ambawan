const demoPatterns = [
  { match: 'Tugas Baru', message: 'Aksi demo: form pembuatan baru dapat dihubungkan ke backend.' },
  { match: 'Mandat Baru', message: 'Aksi demo: form pembuatan baru dapat dihubungkan ke backend.' },
  { match: 'Pengguna Baru', message: 'Aksi demo: form pembuatan baru dapat dihubungkan ke backend.' },
]

export function showDemoAlert(label: string) {
  const found = demoPatterns.find((item) => label.includes(item.match))

  if (found) {
    window.alert(found.message)
  }
}
