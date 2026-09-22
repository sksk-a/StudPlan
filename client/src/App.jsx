import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Empty, ErrorBox, Loading } from './components/Common';
import MainLayout from './layouts/MainLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import Subjects from './pages/Subjects';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
function Protected() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export default function App() {
  const { loading, error, restore, logout } = useAuth();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="container py-5">
        <ErrorBox message={error} retry={restore} />
        <button className="btn btn-light" onClick={logout}>
          Перейти ко входу
        </button>
      </div>
    );
  return (
    <Routes>
      <Route path="/login" element={<AuthPage key="login" />} />
      <Route path="/register" element={<AuthPage key="register" register />} />
      <Route element={<Protected />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/new" element={<TaskForm key="new" />} />
          <Route path="tasks/:id/edit" element={<TaskForm key="edit" />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="statistics" element={<Statistics />} />
          <Route
            path="*"
            element={
              <Empty title="Страница не найдена" to="/" action="На главную">
                Проверьте адрес страницы.
              </Empty>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
