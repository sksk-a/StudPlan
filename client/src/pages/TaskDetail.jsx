import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useResource from '../hooks/useResource';
import { useToast } from '../hooks/useToast';
import api, { errorMessage } from '../api/client';
import { ConfirmDialog, ErrorBox, Loading, PageTitle, SubjectTag } from '../components/Common';
import { dateTime, statuses, types, importance, difficulty } from '../utils/format';
export default function TaskDetail() {
  const { id } = useParams();
  const resource = useResource(`/tasks/${id}`);
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function act(remove) {
    setBusy(true);
    setError('');
    try {
      if (remove) {
        await api.delete(`/tasks/${id}`);
        toast('Задача удалена');
        navigate('/tasks');
      } else {
        await api.patch(`/tasks/${id}/complete`);
        toast('Задача выполнена!');
        resource.reload();
      }
    } catch (e) {
      setDeleting(false);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorBox message={resource.error} retry={resource.reload} />;
  const t = resource.data;
  return (
    <>
      <Link to="/tasks" className="back-link">
        <i aria-hidden="true" className="bi bi-arrow-left" /> Все задачи
      </Link>
      <PageTitle eyebrow={types[t.taskType]} title={t.title} />
      <ErrorBox message={error} />
      <section className="panel editor-form">
        <div className="d-flex gap-3 flex-wrap mb-4">
          <SubjectTag subject={t.subject} />
          <span className={`status-badge status-${t.status}`}>{statuses[t.status]}</span>
          {t.overdue && <span className="text-danger">Просрочено</span>}
        </div>
        <p className="description">{t.description || 'Описание не добавлено.'}</p>
        <dl className="detail-grid">
          {[
            ['Дедлайн', dateTime(t.deadline)],
            ['Важность', importance[t.importance]],
            ['Сложность', difficulty[t.difficulty]],
            ['Время выполнения', `${t.estimatedMinutes} мин.`],
            ['Создана', dateTime(t.createdAt)],
            ...(t.completedAt ? [['Выполнена', dateTime(t.completedAt)]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="priority-explanation">
          <strong>
            <i aria-hidden="true" className="bi bi-stars" /> Приоритет: {t.priorityScore} баллов
          </strong>
          <p className="mb-0 mt-2">{t.priorityReason}</p>
        </div>
        <div className="d-flex gap-2 flex-wrap mt-4">
          {t.status !== 'completed' && (
            <button disabled={busy} className="btn btn-success" onClick={() => act(false)}>
              Выполнено
            </button>
          )}
          <Link className="btn btn-primary" to={`/tasks/${id}/edit`}>
            Редактировать
          </Link>
          <button
            disabled={busy}
            className="btn btn-outline-danger"
            onClick={() => setDeleting(true)}
          >
            Удалить
          </button>
        </div>
      </section>
      {deleting && (
        <ConfirmDialog
          title="Удалить задачу?"
          busy={busy}
          onClose={() => setDeleting(false)}
          onConfirm={() => act(true)}
        >
          Вы действительно хотите удалить эту задачу? «{t.title}» будет удалена.
        </ConfirmDialog>
      )}
    </>
  );
}
