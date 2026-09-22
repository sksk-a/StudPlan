import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import useResource from '../hooks/useResource';
import { useToast } from '../hooks/useToast';
import { ErrorBox, Loading, PageTitle, Empty } from '../components/Common';
import { statuses, types, importance, difficulty, localInput } from '../utils/format';
const blank = {
  title: '',
  description: '',
  subjectId: '',
  taskType: 'homework',
  deadline: '',
  importance: 2,
  difficulty: 2,
  estimatedMinutes: 60,
  status: 'planned',
};
export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const subjects = useResource('/subjects');
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) {
      setForm(blank);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    api
      .get(`/tasks/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setForm(
          Object.fromEntries(
            Object.keys(blank).map((key) => [
              key,
              key === 'deadline' ? localInput(data[key]) : data[key],
            ]),
          ),
        );
      })
      .catch((e) => {
        if (e.code !== 'ERR_CANCELED') setLoadError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...form,
        deadline: new Date(form.deadline).toISOString(),
        subjectId: Number(form.subjectId),
        importance: Number(form.importance),
        difficulty: Number(form.difficulty),
        estimatedMinutes: Number(form.estimatedMinutes),
      };
      if (id) await api.put(`/tasks/${id}`, body);
      else await api.post('/tasks', body);
      toast(id ? 'Изменения сохранены' : 'Задача создана');
      navigate('/tasks');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading || subjects.loading) return <Loading />;
  if (loadError || subjects.error) return <ErrorBox message={loadError || subjects.error} />;
  if (!subjects.data.length)
    return (
      <Empty title="Сначала добавьте предмет" to="/subjects" action="Перейти к предметам">
        Каждая задача относится к одному из ваших предметов.
      </Empty>
    );
  return (
    <>
      <PageTitle eyebrow="ПЛАНИРОВАНИЕ" title={id ? 'Редактировать задачу' : 'Новая задача'}>
        Укажите сроки и параметры — мы поможем выбрать следующий шаг.
      </PageTitle>
      <form className="panel editor-form" onSubmit={submit}>
        <ErrorBox message={error} />
        <label className="form-label w-100">
          Название *
          <input
            className="form-control"
            name="title"
            value={form.title}
            onChange={change}
            required
            maxLength={200}
            placeholder="Например, подготовить лабораторную работу"
          />
        </label>
        <label className="form-label w-100">
          Описание
          <textarea
            className="form-control"
            name="description"
            value={form.description}
            onChange={change}
            maxLength={10000}
            rows={4}
            placeholder="Что нужно сделать и на что обратить внимание"
          />
        </label>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label w-100">
              Предмет *
              <select
                aria-label="Предмет *"
                className="form-select"
                name="subjectId"
                value={form.subjectId}
                onChange={change}
                required
              >
                <option value="">Выберите предмет</option>
                {subjects.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {[
            ['taskType', 'Тип задания *', types],
            ['importance', 'Важность *', importance],
            ['difficulty', 'Сложность *', difficulty],
            ['status', 'Статус *', statuses],
          ].map(([name, title, values]) => (
            <div className="col-md-6" key={name}>
              <label className="form-label w-100">
                {title}
                <select
                  aria-label={title}
                  className="form-select"
                  name={name}
                  value={form[name]}
                  onChange={change}
                  required
                >
                  {Object.entries(values).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <div className="col-md-6">
            <label className="form-label w-100">
              Дедлайн *
              <input
                className="form-control"
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={change}
                required
              />
            </label>
          </div>
          <div className="col-md-6">
            <label className="form-label w-100">
              Время выполнения, минут *
              <input
                className="form-control"
                type="number"
                name="estimatedMinutes"
                value={form.estimatedMinutes}
                onChange={change}
                min={1}
                max={525600}
                step={1}
                required
              />
            </label>
          </div>
        </div>
        <p className="small text-secondary mt-3">
          * Обязательные поля. Время отображается в часовом поясе вашего устройства.
        </p>
        <div className="d-flex gap-2 mt-4">
          <button disabled={busy} className="btn btn-primary">
            {busy ? 'Сохранение…' : 'Сохранить задачу'}
          </button>
          <Link className="btn btn-light" to="/tasks">
            Отмена
          </Link>
        </div>
      </form>
    </>
  );
}
