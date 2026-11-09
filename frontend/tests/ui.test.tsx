import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { Chip, StatusChip } from '../src/components/ui/Chip';
import { Modal } from '../src/components/ui/Modal';
import { ProgressBar } from '../src/components/ui/ProgressBar';
import { StatCard } from '../src/components/ui/StatCard';
import { Donut } from '../src/components/ui/Donut';
import { WeekChart } from '../src/components/ui/WeekChart';

describe('Chip', () => {
  it('menampilkan teks anak', () => {
    render(<Chip>P1</Chip>);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('memakai bg-white saat tidak ada className', () => {
    render(<Chip>Normal</Chip>);
    expect(screen.getByText('Normal')).toHaveClass('bg-white');
  });

  it('memakai className yang diberikan', () => {
    render(<Chip className="bg-mk-red-soft">Mendesak</Chip>);
    expect(screen.getByText('Mendesak')).toHaveClass('bg-mk-red-soft');
  });
});

describe('StatusChip', () => {
  it('menampilkan label Indonesia untuk tiap status', () => {
    const { rerender } = render(<StatusChip status="BACKLOG" />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    rerender(<StatusChip status="COMPLETED" />);
    expect(screen.getByText('Selesai')).toBeInTheDocument();
    rerender(<StatusChip status="BLOCKED" />);
    expect(screen.getByText('Terhambat')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  // Batang dalam adalah satu-satunya elemen dengan inline style (width).
  const barOf = (container: HTMLElement) => container.querySelector('[style]');

  it('mengatur lebar sesuai persen', () => {
    const { container } = render(<ProgressBar percent={60} />);
    expect(barOf(container)).toHaveStyle({ width: '60%' });
  });

  it('membatasi persen ke 0–100', () => {
    const { container, rerender } = render(<ProgressBar percent={150} />);
    expect(barOf(container)).toHaveStyle({ width: '100%' });
    rerender(<ProgressBar percent={-20} />);
    expect(barOf(container)).toHaveStyle({ width: '0%' });
  });

  it('memakai barClass yang diberikan', () => {
    const { container } = render(<ProgressBar percent={50} barClass="bg-mk-blue" />);
    expect(barOf(container)).toHaveClass('bg-mk-blue');
  });
});

describe('StatCard', () => {
  it('menampilkan label, nilai, dan detail', () => {
    render(<StatCard label="Total Tugas" value="12" detail="3 selesai" />);
    expect(screen.getByText('Total Tugas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 selesai')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('menampilkan judul dan isi', () => {
    render(
      <Modal title="Buat Project" onClose={() => {}}>
        <p>Isi form</p>
      </Modal>,
    );
    expect(screen.getByText('Buat Project')).toBeInTheDocument();
    expect(screen.getByText('Isi form')).toBeInTheDocument();
  });

  it('memanggil onClose saat tombol Tutup diklik', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Hapus" onClose={onClose}>
        <p>Yakin?</p>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('memanggil onClose saat backdrop diklik', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Hapus" onClose={onClose}>
        <p>Yakin?</p>
      </Modal>,
    );
    await user.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tidak memanggil onClose saat area dalam modal diklik', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Hapus" onClose={onClose}>
        <p>Yakin?</p>
      </Modal>,
    );
    await user.click(screen.getByText('Yakin?'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Donut', () => {
  it('menampilkan persen dan label', () => {
    render(<Donut percent={75} label="Selesai" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Selesai')).toBeInTheDocument();
  });

  it('membatasi persen ke 0–100', () => {
    const { rerender } = render(<Donut percent={150} label="Selesai" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    rerender(<Donut percent={-10} label="Selesai" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('WeekChart', () => {
  const data = [
    { week: 'W1', label: '1–7 Nov', count: 3 },
    { week: 'W2', label: '8–14 Nov', count: 8 },
  ];

  it('menampilkan minggu, label, dan jumlah', () => {
    render(<WeekChart data={data} />);
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('8–14 Nov')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('mengatur tinggi batang relatif terhadap jumlah terbesar', () => {
    const { container } = render(<WeekChart data={data} />);
    const bars = container.querySelectorAll('.bg-mk-yellow');
    expect(bars).toHaveLength(2);
    expect(bars[1]).toHaveStyle({ height: '100%' });
    expect(bars[0]).toHaveStyle({ height: '37.5%' });
  });
});
