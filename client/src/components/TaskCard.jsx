import { Link } from 'react-router-dom';
import { SubjectTag } from './Common';
import { dateTime, statuses, types, importance, difficulty } from '../utils/format';
export default function TaskCard({ task, onComplete, onDelete, busy }) {
  const overdue = task.status !== 'completed' && new Date(task.deadline) < new Date();
  return (
    <article
      className={`task-card ${task.status === 'completed' ? 'is-complete' : ''}`}
      style={{ '--subject-color': task.subject.color }}
    >
      <div className="d-flex justify-content-between gap-2 flex-wrap">
        <SubjectTag subject={task.subject} />
        <span className={`status-badge status-${task.status}`}>{statuses[task.status]}</span>
      </div>
      <h3>
        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
      </h3>
      <div className="task-meta">
        <span>
          <i aria-hidden="true" className="bi bi-calendar3" /> {dateTime(task.deadline)}
        </span>
        {overdue && <span className="text-danger fw-semibold">Просрочено</span>}
      </div>
      <div className="task-meta mt-2">
        <span>{types[task.taskType]}</span>
        <span>Важность: {importance[task.importance]}</span>
        <span>Сложность: {difficulty[task.difficulty]}</span>
        <span>{task.estimatedMinutes} мин.</span>
      </div>
      <div className="task-footer">
        <span className="score" title={task.priorityReason}>
          <i aria-hidden="true" className="bi bi-stars" /> {task.priorityScore} баллов
        </span>
        <div className="d-flex gap-2">
          {onComplete && task.status !== 'completed' && (
            <button
              disabled={busy}
              className="btn btn-sm btn-outline-success"
              onClick={() => onComplete(task)}
            >
              <i aria-hidden="true" className="bi bi-check2" /> Выполнено
            </button>
          )}
          <Link
            className="btn btn-sm btn-light"
            aria-label={`Редактировать: ${task.title}`}
            to={`/tasks/${task.id}/edit`}
          >
            <i aria-hidden="true" className="bi bi-pencil" />
          </Link>
          {onDelete && (
            <button
              disabled={busy}
              className="btn btn-sm btn-light text-danger"
              aria-label={`Удалить: ${task.title}`}
              onClick={() => onDelete(task)}
            >
              <i aria-hidden="true" className="bi bi-trash3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
