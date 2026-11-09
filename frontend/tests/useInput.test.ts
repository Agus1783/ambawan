import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import useInput from '../src/hooks/useInput';

describe('useInput', () => {
  it('mengembalikan nilai awal', () => {
    const { result } = renderHook(() => useInput('awal'));
    expect(result.current[0]).toBe('awal');
  });

  it('mengembalikan string kosong saat tanpa nilai awal', () => {
    const { result } = renderHook(() => useInput());
    expect(result.current[0]).toBe('');
  });

  it('mengubah nilai lewat setValue', () => {
    const { result } = renderHook(() => useInput(''));
    act(() => {
      result.current[2]('halo');
    });
    expect(result.current[0]).toBe('halo');
  });

  it('mengubah nilai lewat handleChange', () => {
    const { result } = renderHook(() => useInput(''));
    act(() => {
      result.current[1]({ target: { value: 'ketik' } } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current[0]).toBe('ketik');
  });
});
