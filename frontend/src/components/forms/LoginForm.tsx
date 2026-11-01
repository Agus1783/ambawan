import useInput from "../../hooks/useInput";

function LoginForm({ login }: { login: (credentials: { email: string; password: string; }) => void}) {
  const [email, setEmail] = useInput('');
  const [password, setPassword] = useInput('');

  return (
    <form>
      <input type="text" value={email} onChange={setEmail} placeholder="Email" />
      <input type="password" value={password} onChange={setPassword} placeholder="Password" />
      <button type="button" onClick={() => login({ email, password })}>Login</button>
    </form>
  );
}

export default LoginForm;
