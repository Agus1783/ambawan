import useInput from '../../hooks/useInput';
import { btnYellowClass, fieldClass, fieldLabelClass, inputClass } from '../ui/UiClasses';

function RegisterForm({
  register,
  disabled = false,
}: {
  register: (data: { name: string; email: string; password: string; }) => void;
  disabled?: boolean;
}) {
  const [name, setName] = useInput('');
  const [email, setEmail] = useInput('');
  const [password, setPassword] = useInput('');

  return (
    <form className="flex flex-col gap-3">
      <label className={fieldClass}>
        <span className={fieldLabelClass}>Nama</span>
        <input type="text" value={name} onChange={setName} placeholder="Name" className={inputClass} disabled={disabled} />
      </label>
      <label className={fieldClass}>
        <span className={fieldLabelClass}>Email</span>
        <input type="text" value={email} onChange={setEmail} placeholder="Email" className={inputClass} disabled={disabled} />
      </label>
      <label className={fieldClass}>
        <span className={fieldLabelClass}>Password</span>
        <input type="password" value={password} onChange={setPassword} placeholder="Password" className={inputClass} disabled={disabled} />
      </label>
      <button type="button" className={btnYellowClass} onClick={() => register({ name, email, password })} disabled={disabled}>Register</button>
    </form>
  );
}

export default RegisterForm;
