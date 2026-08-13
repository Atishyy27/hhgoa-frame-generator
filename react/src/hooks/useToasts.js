import { useCallback, useRef, useState } from "react";

let nextId = 1;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const activeMessages = useRef(new Set());

  const showToast = useCallback((message, type = "info", duration = 3200) => {
    if (activeMessages.current.has(message)) return;
    activeMessages.current.add(message);
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        activeMessages.current.delete(message);
      }, 260);
    }, duration);
  }, []);

  return { toasts, showToast };
}
