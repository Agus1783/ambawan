// import React from 'react';
import useInput from '../../hooks/useInput';

function RegisterForm({
  register }: { register: (data: { name: string; email: string; password: string; }) => void })
{

  const [name, setName] = useInput('');
  const [email, setEmail] = useInput('');
  const [password, setPassword] = useInput('');

  return (
    <form>
      <input type="text" value={name} onChange={setName} placeholder="Name" />
      <input type="text" value={email} onChange={setEmail} placeholder="Email" />
      <input type="password" value={password} onChange={setPassword} placeholder="Password" />
      <button type="button" onClick={() => register({ name, email, password })}>Register</button>
    </form>
  );
}

export default RegisterForm;
