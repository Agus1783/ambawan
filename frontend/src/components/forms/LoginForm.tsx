import useInput from "../../hooks/useInput";
import { btnYellowClass, fieldClass, fieldLabelClass, inputClass } from "../ui/UiClasses";

function LoginForm({ login, disabled = false }: {
  login: (credentials: { email: string; password: string; }) => void;
  disabled?: boolean;
}) {
  const [email, setEmail] = useInput('');
  const [password, setPassword] = useInput('');

  return (
    <form className="flex flex-col gap-3">
      <label className={fieldClass}>
        <span className={fieldLabelClass}>Email</span>
        <input type="text" value={email} onChange={setEmail} placeholder="Email" className={inputClass} disabled={disabled} />
      </label>
      <label className={fieldClass}>
        <span className={fieldLabelClass}>Password</span>
        <input type="password" value={password} onChange={setPassword} placeholder="Password" className={inputClass} disabled={disabled} />
      </label>
      <button type="button" className={btnYellowClass} onClick={() => login({ email, password })} disabled={disabled}>Login</button>
    </form>
  );
}

export default LoginForm;
