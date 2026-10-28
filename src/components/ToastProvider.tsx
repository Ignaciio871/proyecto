'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ToastType } from '@/lib/types';

type Notify = (msg: string, type?: ToastType) => void;

const ToastContext = createContext<Notify>(() => {});

export const useToast = () => useContext(ToastContext);

const Toast = ({ msg, type, onClose }: { msg: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span>{msg}</span>
    </div>
  );
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({ msg: '', type: 'info' });

  const notify = useCallback<Notify>((msg, type = 'info') => setToast({ msg, type }), []);
  const close  = useCallback(() => setToast({ msg: '', type: 'info' }), []);

  return (
    <ToastContext.Provider value={notify}>
      <Toast msg={toast.msg} type={toast.type} onClose={close} />
      {children}
    </ToastContext.Provider>
  );
}
