import type { ChangeEvent } from 'react';
import { useState } from 'react';

function useInput(defaultValue = '') {
  const [value, setValue] = useState(defaultValue);

  function handleValueChange({ target }: ChangeEvent<HTMLInputElement>) {
    setValue(target.value)
  }

  return [value, handleValueChange, setValue] as const;
}
export default useInput;
