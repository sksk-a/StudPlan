import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner-border spinner-border-sm me-2" />
      Загрузка…
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return message ? (
    <div className="alert alert-danger" role="alert">
      {message}
      {retry && (
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={retry}>
          Повторить
        </button>
      )}
    </div>
  ) : null;
}
export function Empty({ title = 'Пока ничего нет', children, to, action }) {
  return (
    <div className="empty-state">
      <i aria-hidden="true" className="bi bi-journal-check" />
      <h3>{title}</h3>
      <p>{children}</p>
      {to && (
        <Link className="btn btn-primary" to={to}>
          {action}
        </Link>
      )}
    </div>
  );
}
export function PageTitle({ eyebrow, title, children, action }) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p className="text-secondary mb-0">{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function SubjectTag({ subject }) {
  return (
    <span className="subject-tag">
      <span style={{ background: subject.color }} />
      {subject.name}
    </span>
  );
}
export function ConfirmDialog({ title, children, busy, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="confirm-title" className="h5">
        {title}
      </h2>
      <div className="text-secondary my-3">{children}</div>
      <div className="d-flex gap-2 justify-content-end">
        <button autoFocus className="btn btn-light" disabled={busy} onClick={onClose}>
          Отмена
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Удаление…' : 'Удалить'}
        </button>
      </div>
    </dialog>
  );
}
export function StatCards({ data }) {
  return (
    <div className="stats-grid">
      {[
        ['Всего задач', data.total, 'stack', 'purple'],
        ['Выполнено', data.completed, 'check2-circle', 'green'],
        ['В процессе', data.inProgress, 'hourglass-split', 'blue'],
        ['Просрочено', data.overdue, 'exclamation-circle', 'orange'],
      ].map(([label, value, icon, color]) => (
        <div className="stat-card" key={label}>
          <span className={`stat-icon ${color}`}>
            <i aria-hidden="true" className={`bi bi-${icon}`} />
          </span>
          <div>
            <div className="stat-number">{value}</div>
            <div className="text-secondary small">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
