'use client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`glass rounded-xl p-4 border flex items-start gap-3 shadow-xl ${
              toast.variant === 'destructive'
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-cyan-500/20 bg-cyan-500/5'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.variant === 'destructive'
                ? <XCircle className="w-5 h-5 text-red-400" />
                : <CheckCircle className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-white font-medium text-sm">{toast.title}</p>}
              {toast.description && <p className="text-gray-400 text-xs mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
