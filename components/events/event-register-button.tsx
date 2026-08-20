'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, QrCode, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface Props {
  eventId: string;
  isFull: boolean;
  isLoggedIn: boolean;
  userRegistration: { id: string; checkIn: any } | null;
}

export function EventRegisterButton({ eventId, isFull, isLoggedIn, userRegistration }: Props) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regId, setRegId] = useState(userRegistration?.id ?? null);
  const router = useRouter();

  if (userRegistration || registered) {
    const rid = regId || userRegistration?.id;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-green-400 font-semibold text-sm">Registration Confirmed</div>
            {userRegistration?.checkIn && <div className="text-green-300/60 text-xs">Already checked in</div>}
          </div>
        </div>
        {rid && (
          <Link href={`/my-events/${rid}/qr`} className="flex items-center justify-between w-full bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 rounded-xl px-4 py-3 text-sm transition-all">
            <div className="flex items-center gap-2"><QrCode className="w-4 h-4" /> View QR Pass</div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </motion.div>
    );
  }

  if (isFull) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <Lock className="w-5 h-5 text-red-400" />
        <div className="text-red-400 font-semibold text-sm">Event is Full</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3.5 rounded-xl text-sm transition-colors">
        Sign In to Register <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) });
      const json = await res.json();
      if (!json.success) {
        toast({ title: 'Registration Failed', description: json.message, variant: 'destructive' });
        return;
      }
      setRegistered(true);
      setRegId(json.registrationId);
      toast({ title: 'Registration Successful', description: 'Your QR pass has been generated.' });
      router.refresh();
    } catch {
      toast({ title: 'Error', description: 'Registration failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleRegister} disabled={loading} className="flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20">
      {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>Register Now <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}
