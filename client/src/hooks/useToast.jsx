import { createContext, useContext, useEffect, useState } from 'react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  return (
    <ToastContext.Provider value={(message) => setToast({ message })}>
      {children}
      {toast && (
        <div className="notification shadow" role="status">
          <i aria-hidden="true" className="bi bi-check-circle-fill text-success" /> {toast.message}
          <button
            className="btn-close ms-3"
            aria-label="Закрыть уведомление"
            onClick={() => setToast(null)}
          />
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
