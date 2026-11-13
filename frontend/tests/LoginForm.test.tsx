import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import LoginForm from '../src/components/forms/LoginForm';

describe('LoginForm', () => {
  it('menampilkan input email, input password, dan tombol Login', () => {
    render(<LoginForm login={() => {}} />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('menyimpan ketikan email dan password', async () => {
    const user = userEvent.setup();
    render(<LoginForm login={() => {}} />);

    await user.type(screen.getByPlaceholderText('Email'), 'email@test');
    await user.type(screen.getByPlaceholderText('Password'), 'passwordtest');

    expect(screen.getByPlaceholderText('Email')).toHaveValue('email@test');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('passwordtest');
  });

  it('memanggil login dengan email dan password saat tombol diklik', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();
    render(<LoginForm login={mockLogin} />);

    await user.type(screen.getByPlaceholderText('Email'), 'email@test');
    await user.type(screen.getByPlaceholderText('Password'), 'passwordtest');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ email: 'email@test', password: 'passwordtest' });
  });

  it('memanggil login dengan string kosong saat form kosong', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();
    render(<LoginForm login={mockLogin} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    // Form saat ini belum punya validasi — perilaku ini didokumentasikan
    // lewat test supaya kalau nanti ditambah validasi, test ini gagal
    // dan mengingatkan untuk memperbarui ekspektasi.
    expect(mockLogin).toHaveBeenCalledWith({ email: '', password: '' });
  });
});
