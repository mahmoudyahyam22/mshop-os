// FIX: Import React default export to use React.FC type.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

const Portal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    // This should ideally not happen if index.html is correct
    console.error("The element #modal-root was not found");
    return null;
  }

  return createPortal(children, modalRoot);
};

export default Portal;
