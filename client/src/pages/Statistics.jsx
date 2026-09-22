import useResource from '../hooks/useResource';
import { PageTitle, StatCards, Loading, ErrorBox, Empty } from '../components/Common';
import Chart from '../components/Chart';
export default function Statistics() {
  const { data, loading, error, reload } = useResource('/statistics');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const subjectData = {
    labels: data.bySubject.map((s) => s.name),
    datasets: [
      {
        label: 'Всего задач',
        data: data.bySubject.map((s) => s.total),
        backgroundColor: data.bySubject.map((s) => s.color),
        borderRadius: 6,
      },
      {
        label: 'Выполнено',
        data: data.bySubject.map((s) => s.completed),
        backgroundColor: '#cbd5e1',
        borderRadius: 6,
      },
    ],
  };
  const statusData = {
    labels: ['Запланировано', 'В процессе', 'Выполнено'],
    datasets: [
      {
        data: [data.planned, data.inProgress, data.completed],
        backgroundColor: ['#cbd5e1', '#6366f1', '#22c55e'],
        borderWidth: 4,
        borderColor: '#ffffff',
      },
    ],
  };
  return (
    <>
      <PageTitle eyebrow="КАЖДЫЙ ШАГ ИМЕЕТ ЗНАЧЕНИЕ" title="Статистика">
        Посмотрите, как продвигается ваша учёба.
      </PageTitle>
      <StatCards data={data} />
      {data.total ? (
        <>
          <div className="completion-banner">
            <div>
              <strong>{data.completionPercent}% учебного плана выполнено</strong>
              <p className="mb-0 text-secondary">
                Завершено {data.completed} из {data.total} задач.
              </p>
            </div>
            <i aria-hidden="true" className="bi bi-trophy" />
          </div>
          <div className="charts-grid">
            <section className="panel">
              <h2>Задачи по предметам</h2>
              <Chart
                type="bar"
                data={subjectData}
                label="Количество всех и выполненных задач по предметам"
              />
            </section>
            <section className="panel">
              <h2>Статусы задач</h2>
              <Chart
                type="doughnut"
                data={statusData}
                label={`Запланировано ${data.planned}, в процессе ${data.inProgress}, выполнено ${data.completed}`}
              />
            </section>
          </div>
          <section className="panel mt-4">
            <h2>По предметам</h2>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Предмет</th>
                    <th>Всего</th>
                    <th>Выполнено</th>
                    <th>Прогресс</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySubject.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="deadline-dot me-2" style={{ background: s.color }} />
                        {s.name}
                      </td>
                      <td>{s.total}</td>
                      <td>{s.completed}</td>
                      <td>{s.total ? Math.round((s.completed / s.total) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <Empty
          title="Статистика появится вместе с задачами"
          to="/tasks/new"
          action="Создать задачу"
        >
          Начните планировать, чтобы видеть свой прогресс.
        </Empty>
      )}
    </>
  );
}
