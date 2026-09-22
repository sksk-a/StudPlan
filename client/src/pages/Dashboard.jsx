import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { Empty, ErrorBox, Loading, PageTitle, StatCards, SubjectTag } from '../components/Common';
import { dateTime, importance, difficulty } from '../utils/format';
export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource('/dashboard');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const { statistics: stats, recommendedTask: task, upcomingTasks } = data;
  return (
    <>
      <PageTitle
        eyebrow={new Date().toLocaleDateString('ru-RU', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={`Привет, ${user.username}!`}
        action={
          <Link className="btn btn-primary" to="/tasks/new">
            <i aria-hidden="true" className="bi bi-plus-lg me-2" />
            Новая задача
          </Link>
        }
      >
        Всё важное для продуктивного учебного дня.
      </PageTitle>
      <StatCards data={stats} />
      <div className="dashboard-grid">
        <section className="recommendation">
          <div className="eyebrow">
            <i aria-hidden="true" className="bi bi-stars me-2" />
            УМНЫЙ ПРИОРИТЕТ
          </div>
          <h2>Рекомендуем выполнить следующим</h2>
          {task ? (
            <>
              <SubjectTag subject={task.subject} />
              <h3>{task.title}</h3>
              <p className="recommendation-reason">{task.priorityReason}</p>
              <div className="recommendation-details">
                <span>
                  <i aria-hidden="true" className="bi bi-calendar3" /> {dateTime(task.deadline)}
                </span>
                <span>
                  <i aria-hidden="true" className="bi bi-clock" /> {task.estimatedMinutes} мин.
                </span>
                <span>Важность: {importance[task.importance]}</span>
                <span>Сложность: {difficulty[task.difficulty]}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4">
                <Link className="btn btn-primary" to={`/tasks/${task.id}`}>
                  Открыть задачу <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
                </Link>
                <span className="score">{task.priorityScore} баллов приоритета</span>
              </div>
            </>
          ) : (
            <Empty
              title={stats.total ? 'Всё выполнено!' : 'Начнём с первой задачи'}
              to="/tasks/new"
              action="Добавить задачу"
            >
              {stats.total
                ? 'Отличная работа. Можно немного отдохнуть.'
                : 'Добавьте предмет и запланируйте работу.'}
            </Empty>
          )}
        </section>
        <section className="panel progress-panel">
          <div className="section-title">
            <h2>Твой прогресс</h2>
            <i aria-hidden="true" className="bi bi-graph-up-arrow text-success" />
          </div>
          <div className="progress-ring" style={{ '--progress': `${stats.completionPercent}%` }}>
            <div>
              <strong>{stats.completionPercent}%</strong>
              <span>выполнено</span>
            </div>
          </div>
          <p>
            <strong>{stats.completed}</strong> из {stats.total} задач завершено
          </p>
          <div
            className="progress"
            role="progressbar"
            aria-label="Выполнение задач"
            aria-valuenow={stats.completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${stats.completionPercent}%` }} />
          </div>
          <p className="small text-secondary mt-3">Каждая выполненная задача — шаг вперёд.</p>
          <Link to="/statistics" className="small">
            Посмотреть статистику <i aria-hidden="true" className="bi bi-arrow-right" />
          </Link>
        </section>
      </div>
      <section className="panel mt-4">
        <div className="section-title">
          <h2>Ближайшие дедлайны</h2>
          <Link to="/calendar">
            Открыть календарь <i aria-hidden="true" className="bi bi-arrow-right" />
          </Link>
        </div>
        {upcomingTasks.length ? (
          <div className="deadline-list">
            {upcomingTasks.map((t) => (
              <Link to={`/tasks/${t.id}`} key={t.id} className="deadline-row">
                <span className="deadline-dot" style={{ background: t.subject.color }} />
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.subject.name}</small>
                </div>
                <span className={t.overdue ? 'text-danger' : 'text-secondary'}>
                  {t.overdue && 'Просрочено · '}
                  {dateTime(t.deadline)}
                </span>
                <i aria-hidden="true" className="bi bi-chevron-right" />
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="Нет незавершённых задач">Новые дедлайны появятся здесь.</Empty>
        )}
      </section>
    </>
  );
}
