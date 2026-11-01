import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { asyncRegisterUser } from '../states/users/action';
import RegisterForm from '../components/RegisterForm';

function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onRegister = ({ name, email, password }) => {
    dispatch(asyncRegisterUser({ name, email, password }));

    navigate('/auth/register');
  };

  return (
    <section className="register-page">
      <header className="register-page__hero">
        {/*<h1><IoEarthOutline />}</h1>*/}
        <h1>RegisterPage</h1>
      </header>
      <article className="register-page__main">
        <h2>Create your account</h2>
        <RegisterForm register={onRegister} />

        <p>
          Already have an account?
          {' '}
          <Link to="/auth/login">Login</Link>
        </p>
      </article>
    </section>
  );
};

export default RegisterPage;
