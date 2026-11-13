import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import RegisterForm from '../src/components/forms/RegisterForm';

describe('RegisterForm', () => {
  it('menampilkan input nama, email, password, dan tombol Register', () => {
    render(<RegisterForm register={() => {}} />);

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('menyimpan ketikan nama, email, dan password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm register={() => {}} />);

    await user.type(screen.getByPlaceholderText('Name'), 'Budi Santoso');
    await user.type(screen.getByPlaceholderText('Email'), 'budi@ambado.id');
    await user.type(screen.getByPlaceholderText('Password'), 'rahasia123');

    expect(screen.getByPlaceholderText('Name')).toHaveValue('Budi Santoso');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('budi@ambado.id');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('rahasia123');
  });

  it('memanggil register dengan nama, email, dan password saat tombol diklik', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn();
    render(<RegisterForm register={mockRegister} />);

    await user.type(screen.getByPlaceholderText('Name'), 'Budi Santoso');
    await user.type(screen.getByPlaceholderText('Email'), 'budi@ambado.id');
    await user.type(screen.getByPlaceholderText('Password'), 'rahasia123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({
      name: 'Budi Santoso',
      email: 'budi@ambado.id',
      password: 'rahasia123',
    });
  });
});
