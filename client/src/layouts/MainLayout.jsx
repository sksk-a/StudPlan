import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
const links = [
  ['/', 'grid-1x2', 'Обзор'],
  ['/tasks', 'check2-square', 'Задачи'],
  ['/calendar', 'calendar3', 'Календарь'],
  ['/subjects', 'journal-bookmark', 'Предметы'],
  ['/statistics', 'bar-chart', 'Статистика'],
];
export default function MainLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span>
            <i aria-hidden="true" className="bi bi-mortarboard-fill" />
          </span>
          СтудПлан
        </Link>
        <div className="sidebar-caption">МОЁ ОБУЧЕНИЕ</div>
        <nav aria-label="Главная навигация">
          {links.map(([to, icon, text]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <i aria-hidden="true" className={`bi bi-${icon}`} />
              {text}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <i aria-hidden="true" className="bi bi-lightbulb" />
          <strong>По одной задаче за раз</strong>
          <p>Большие результаты начинаются с небольших шагов.</p>
        </div>
        <div className="sidebar-bottom">Учись в своём ритме</div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="topbar-label">Твой учебный план</span>
          <div className="d-flex align-items-center gap-3">
            <span className="avatar">{user.username[0].toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
            <button className="btn btn-sm btn-light" onClick={logout}>
              <i aria-hidden="true" className="bi bi-box-arrow-right me-1" />
              Выйти
            </button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="page-footer">
          СтудПлан <span>Меньше хаоса. Больше выполненных задач.</span>
        </footer>
      </div>
    </div>
  );
}
