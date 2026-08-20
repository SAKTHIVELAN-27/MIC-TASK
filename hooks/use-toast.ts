'use client';
import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

let toastState: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notify() {
  listeners.forEach((l) => l([...toastState]));
}

export function toast(opts: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  const t: Toast = { id, duration: 4000, ...opts };
  toastState = [t, ...toastState].slice(0, 5);
  notify();
  setTimeout(() => {
    toastState = toastState.filter((x) => x.id !== id);
    notify();
  }, t.duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState);

  // Subscribe
  if (typeof window !== 'undefined') {
    if (!listeners.includes(setToasts)) {
      listeners.push(setToasts);
    }
  }

  const dismiss = useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts, dismiss };
}
