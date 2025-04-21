import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  let bg = 'bg-blue-500';
  if (type === 'success') bg = 'bg-green-500';
  if (type === 'error') bg = 'bg-red-500';

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${bg}`}
         role="alert">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">×</button>
    </div>
  );
};

export default Toast;
