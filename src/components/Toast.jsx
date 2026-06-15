import { useEffect } from 'react';
import { CheckCircleIcon, CloseIcon } from './Icons';

const icons = {
  success: <CheckCircleIcon size={16} color="#fff" />,
  error: <CloseIcon size={16} color="#fff" />,
  info: null,
};

export default function Toast({ msg, type = 'info', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`toast toast-${type}`}>
      {icons[type]}
      <span>{msg}</span>
    </div>
  );
}