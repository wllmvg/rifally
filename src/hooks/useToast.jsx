import { useState } from 'react';
import Toast from '../components/Toast';

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'info') => setToast({ msg, type });
  const el = toast ? <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} /> : null;
  return [show, el];
}