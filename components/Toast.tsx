import React, { useEffect } from 'react';
import { CheckCircleIcon, XIcon } from './icons';

interface ToastProps {
  id: number;
  message: string;
  type: 'success';
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 4000); 

    return () => {
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  const borderColor = type === 'success' ? 'border-[var(--accent-cyan)]' : 'border-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XIcon;

  return (
    <div className={`glass-card text-white p-4 rounded-lg shadow-lg flex items-center animate-slide-in-left border ${borderColor} shadow-[0_0_15px_var(--accent-glow)]`}>
      <Icon className="w-6 h-6 me-3 text-[var(--accent-cyan)]" />
      <span>{message}</span>
      <button onClick={() => onDismiss(id)} className="ms-auto -mr-1 p-1 text-[var(--text-secondary)] hover:text-white">
        <XIcon className="w-5 h-5" />
      </button>
      <style>{`
        @keyframes slide-in-left {
            0% {
                opacity: 0;
                transform: translateX(100%);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .animate-slide-in-left {
            animation: slide-in-left 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;