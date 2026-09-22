import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useResource from '../hooks/useResource';
import { PageTitle, ErrorBox, Loading } from '../components/Common';
import { dateKey } from '../utils/format';
export default function Calendar() {
  const resource = useResource('/tasks');
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const byDay = useMemo(() => {
    const map = {};
    for (const task of resource.data || []) {
      const key = dateKey(task.deadline);
      (map[key] ||= []).push(task);
    }
    return map;
  }, [resource.data]);
  const first = new Date(month);
  first.setDate(1 - ((month.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(first);
    day.setDate(first.getDate() + i);
    return day;
  });
  const shift = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
    <>
      <PageTitle
        eyebrow="НИ ОДНОГО ЗАБЫТОГО СРОКА"
        title="Календарь"
        action={
          <Link to="/tasks/new" className="btn btn-primary">
            <i aria-hidden="true" className="bi bi-plus-lg me-2" />
            Новая задача
          </Link>
        }
      >
        Нажмите на задачу, чтобы посмотреть детали.
      </PageTitle>
      <ErrorBox message={resource.error} retry={resource.reload} />
      {resource.loading ? (
        <Loading />
      ) : (
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <h2>{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light"
                aria-label="Предыдущий месяц"
                onClick={() => shift(-1)}
              >
                <i aria-hidden="true" className="bi bi-chevron-left" />
              </button>
              <button
                className="btn btn-light"
                onClick={() =>
                  setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                }
              >
                Сегодня
              </button>
              <button
                className="btn btn-light"
                aria-label="Следующий месяц"
                onClick={() => shift(1)}
              >
                <i aria-hidden="true" className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
          <div className="calendar-scroll">
            <div className="calendar-grid">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div key={day} className="calendar-weekday">
                  {day}
                </div>
              ))}
              {days.map((day) => (
                <div
                  key={dateKey(day)}
                  className={`calendar-day ${day.getMonth() !== month.getMonth() ? 'outside-month' : ''}`}
                >
                  <span
                    className={`day-number ${dateKey(day) === dateKey(new Date()) ? 'today' : ''}`}
                  >
                    {day.getDate()}
                  </span>
                  {byDay[dateKey(day)]?.map((t) => (
                    <Link
                      key={t.id}
                      className={`calendar-task ${t.status === 'completed' ? 'completed-event' : ''}`}
                      style={{
                        '--subject-color': t.subject.color,
                        background: `${t.subject.color}14`,
                      }}
                      to={`/tasks/${t.id}`}
                      title={`${t.subject.name}: ${t.title}`}
                    >
                      <span>
                        {new Date(t.deadline).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>{' '}
                      {t.status === 'completed' && '✓ '}
                      {t.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="small text-secondary mt-3 mb-0">
            Цвет соответствует предмету. Выполненные задачи отмечены галочкой. На узком экране
            календарь можно прокручивать по горизонтали.
          </p>
        </section>
      )}
    </>
  );
}
