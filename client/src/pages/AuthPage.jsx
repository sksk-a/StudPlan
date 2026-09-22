import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ErrorBox } from '../components/Common';
import { errorMessage } from '../api/client';
export default function AuthPage({ register = false }) {
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authenticate(
        register ? 'register' : 'login',
        register ? form : { email: form.email, password: form.password },
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand text-white">
          <span>
            <i aria-hidden="true" className="bi bi-mortarboard-fill" />
          </span>
          СтудПлан
        </div>
        <div>
          <div className="eyebrow text-white-50">УЧЁБА ПОД КОНТРОЛЕМ</div>
          <h1>
            Освободи голову.
            <br />
            Сосредоточься
            <br />
            на главном.
          </h1>
          <p>Задачи, дедлайны и понятный следующий шаг — в одном месте.</p>
          <div className="auth-benefits">
            <span>
              <i aria-hidden="true" className="bi bi-check-circle" /> Все предметы рядом
            </span>
            <span>
              <i aria-hidden="true" className="bi bi-stars" /> Умный приоритет задач
            </span>
            <span>
              <i aria-hidden="true" className="bi bi-graph-up" /> Твой прогресс на виду
            </span>
          </div>
        </div>
        <small>Маленькие шаги. Большие результаты.</small>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="eyebrow">НАЧНЁМ СЕГОДНЯ</div>
          <h2>{register ? 'Создать аккаунт' : 'С возвращением!'}</h2>
          <p className="text-secondary mb-4">
            {register ? 'Соберите свой учебный план.' : 'Ваши задачи ждут. Продолжим?'}
          </p>
          <ErrorBox message={error} />
          {register && (
            <label className="form-label w-100">
              Имя
              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={change}
                required
                maxLength={80}
                autoComplete="nickname"
              />
            </label>
          )}
          <label className="form-label w-100">
            Email
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="form-label w-100">
            Пароль
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={change}
              required
              minLength={register ? 8 : 1}
              maxLength={72}
              autoComplete={register ? 'new-password' : 'current-password'}
            />
          </label>
          {register && <p className="small text-secondary">От 8 символов; не более 72 байт.</p>}
          <button disabled={busy} className="btn btn-primary w-100 mt-3">
            {busy ? 'Подождите…' : register ? 'Зарегистрироваться' : 'Войти'}{' '}
            <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
          </button>
          <p className="text-center text-secondary mt-4">
            {register ? 'Уже есть аккаунт? ' : 'Ещё нет аккаунта? '}
            <Link to={register ? '/login' : '/register'}>{register ? 'Войти' : 'Регистрация'}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
