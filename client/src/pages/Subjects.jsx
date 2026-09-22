import { useState } from 'react';
import api, { errorMessage } from '../api/client';
import useResource from '../hooks/useResource';
import { useToast } from '../hooks/useToast';
import { PageTitle, Loading, ErrorBox, Empty, ConfirmDialog } from '../components/Common';
const blank = { name: '', teacher: '', color: '#6366f1' };
export default function Subjects() {
  const resource = useResource('/subjects');
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  function reset() {
    setForm(blank);
    setEditing(null);
    setError('');
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) await api.put(`/subjects/${editing}`, form);
      else await api.post('/subjects', form);
      toast(editing ? 'Предмет изменён' : 'Предмет добавлен');
      reset();
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/subjects/${deleting.id}`);
      if (editing === deleting.id) reset();
      toast('Предмет удалён');
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle eyebrow="ВСЁ ПО ПОЛОЧКАМ" title="Предметы">
        Выберите цвета — они помогут ориентироваться в задачах и календаре.
      </PageTitle>
      <div className="subjects-layout">
        <section>
          <ErrorBox message={resource.error} retry={resource.reload} />
          {resource.loading ? (
            <Loading />
          ) : resource.data?.length ? (
            <div className="subject-grid">
              {resource.data.map((s) => (
                <article
                  className="panel subject-card"
                  key={s.id}
                  style={{ '--subject-color': s.color }}
                >
                  <span
                    className="subject-symbol"
                    style={{ color: s.color, background: `${s.color}14` }}
                  >
                    <i aria-hidden="true" className="bi bi-journal-bookmark" />
                  </span>
                  <h2>{s.name}</h2>
                  <p className="text-secondary">{s.teacher || 'Преподаватель не указан'}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-secondary">Задач: {s._count.tasks}</span>
                    <div className="d-flex gap-2">
                      <button
                        disabled={busy}
                        className="btn btn-sm btn-light"
                        aria-label={`Редактировать предмет: ${s.name}`}
                        onClick={() => {
                          setEditing(s.id);
                          setForm({ name: s.name, teacher: s.teacher, color: s.color });
                          setError('');
                          document.getElementById('subject-name').focus();
                        }}
                      >
                        <i aria-hidden="true" className="bi bi-pencil" />
                      </button>
                      <button
                        disabled={busy}
                        className="btn btn-sm btn-light text-danger"
                        aria-label={`Удалить предмет: ${s.name}`}
                        onClick={() => setDeleting(s)}
                      >
                        <i aria-hidden="true" className="bi bi-trash3" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !resource.error && (
              <Empty title="Добавьте первый предмет">
                Название, преподаватель и цвет — всё, что нужно для начала.
              </Empty>
            )
          )}
        </section>
        <form className="panel subject-form" onSubmit={submit}>
          <h2>{editing ? 'Изменить предмет' : 'Новый предмет'}</h2>
          <ErrorBox message={error} />
          <label className="form-label w-100" htmlFor="subject-name">
            Название *
            <input
              id="subject-name"
              className="form-control"
              name="name"
              value={form.name}
              onChange={change}
              maxLength={120}
              required
            />
          </label>
          <label className="form-label w-100">
            Преподаватель
            <input
              className="form-control"
              name="teacher"
              value={form.teacher}
              onChange={change}
              maxLength={120}
            />
          </label>
          <label className="form-label w-100">
            Цвет
            <input
              className="form-control form-control-color"
              type="color"
              name="color"
              value={form.color}
              onChange={change}
            />
          </label>
          <button className="btn btn-primary w-100 mt-2" disabled={busy}>
            {busy ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить предмет'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-light w-100 mt-2"
              disabled={busy}
              onClick={reset}
            >
              Отмена
            </button>
          )}
          <p className="small text-secondary mt-3 mb-0">
            Предмет с задачами можно удалить после удаления или переноса этих задач.
          </p>
        </form>
      </div>
      {deleting && (
        <ConfirmDialog
          title="Удалить предмет?"
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
        >
          Удалить «{deleting.name}»? Если у предмета есть задачи, сначала перенесите их в другой
          предмет или удалите.
        </ConfirmDialog>
      )}
    </>
  );
}
