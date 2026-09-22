import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import useResource from '../hooks/useResource';
import { useToast } from '../hooks/useToast';
import TaskCard from '../components/TaskCard';
import { PageTitle, ErrorBox, Loading, Empty, ConfirmDialog } from '../components/Common';
import { statuses, types, importance } from '../utils/format';
export default function Tasks() {
  const [filters, setFilters] = useState({
    search: '',
    subjectId: '',
    status: '',
    taskType: '',
    importance: '',
    sort: 'deadline',
  });
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  ).toString();
  const tasks = useResource(`/tasks?${query}`);
  const subjects = useResource('/subjects');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();
  const change = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  async function complete(task) {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/tasks/${task.id}/complete`);
      toast('Задача выполнена!');
      tasks.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/tasks/${deleting.id}`);
      setDeleting(null);
      toast('Задача удалена');
      tasks.reload();
    } catch (e) {
      setDeleting(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="ТВОЙ УЧЕБНЫЙ ПЛАН"
        title="Задачи"
        action={
          <Link className="btn btn-primary" to="/tasks/new">
            <i aria-hidden="true" className="bi bi-plus-lg me-2" />
            Новая задача
          </Link>
        }
      >
        Планируй, расставляй приоритеты и отмечай результат.
      </PageTitle>
      <section className="panel filters">
        <label className="search-field">
          <i aria-hidden="true" className="bi bi-search" />
          <input
            aria-label="Поиск по названию"
            className="form-control"
            placeholder="Найти задачу…"
            name="search"
            maxLength={200}
            value={filters.search}
            onChange={change}
          />
        </label>
        <div className="filter-grid">
          <select
            aria-label="Предмет"
            className="form-select"
            name="subjectId"
            value={filters.subjectId}
            onChange={change}
          >
            <option value="">Все предметы</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {[
            ['status', 'Все статусы', statuses],
            ['taskType', 'Все типы', types],
            ['importance', 'Любая важность', importance],
          ].map(([name, label, options]) => (
            <select
              key={name}
              aria-label={label}
              name={name}
              className="form-select"
              value={filters[name]}
              onChange={change}
            >
              <option value="">{label}</option>
              {Object.entries(options).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          ))}
          <select
            aria-label="Сортировка"
            className="form-select"
            name="sort"
            value={filters.sort}
            onChange={change}
          >
            <option value="deadline">Ближайшие дедлайны</option>
            <option value="importance">Сначала важные</option>
            <option value="priority">Умный приоритет</option>
            <option value="newest">Сначала новые</option>
          </select>
        </div>
      </section>
      <ErrorBox
        message={error || tasks.error || subjects.error}
        retry={() => {
          tasks.reload();
          subjects.reload();
        }}
      />
      {tasks.loading ? (
        <Loading />
      ) : tasks.data?.length ? (
        <>
          <div className="small text-secondary my-3">Найдено задач: {tasks.data.length}</div>
          <div className="task-grid">
            {tasks.data.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busy}
                onComplete={complete}
                onDelete={setDeleting}
              />
            ))}
          </div>
        </>
      ) : (
        !tasks.error && (
          <Empty title="Задач не найдено" to="/tasks/new" action="Добавить задачу">
            Измените фильтры или создайте новую задачу.
          </Empty>
        )
      )}
      {deleting && (
        <ConfirmDialog
          title="Удалить задачу?"
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
        >
          Вы действительно хотите удалить эту задачу? «{deleting.title}» будет удалена без
          возможности восстановления.
        </ConfirmDialog>
      )}
    </>
  );
}
