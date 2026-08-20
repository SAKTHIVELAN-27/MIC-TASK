'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(3, 'Venue must be at least 3 characters'),
  capacity: z.number({ invalid_type_error: 'Capacity must be a number' }).int().min(1).max(100000),
});

type FormData = z.infer<typeof schema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 100 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ title: 'Error', description: json.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Event Created!', description: `${data.name} is now live.` });
      router.push(`/dashboard/${json.event.id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to create event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name' as const, label: 'Event Name', icon: Zap, placeholder: 'TechFest 2026', type: 'text' },
    { name: 'venue' as const, label: 'Venue', icon: MapPin, placeholder: 'Main Auditorium, Block A', type: 'text' },
    { name: 'date' as const, label: 'Date', icon: Calendar, placeholder: '', type: 'date' },
    { name: 'startTime' as const, label: 'Start Time', icon: Clock, placeholder: '', type: 'time' },
    { name: 'endTime' as const, label: 'End Time', icon: Clock, placeholder: '', type: 'time' },
    { name: 'capacity' as const, label: 'Capacity', icon: Users, placeholder: '100', type: 'number' },
  ];

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="tech-label mb-1">New Event</div>
          <h1 className="text-3xl font-black text-white">Create Event</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/8 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="tech-label block mb-2">{field.label}</label>
                  <div className="relative">
                    <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      {...register(field.name, field.name === 'capacity' ? { valueAsNumber: true } : {})}
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm [color-scheme:dark]"
                    />
                  </div>
                  {errors[field.name] && <p className="text-red-400 text-xs mt-1">{errors[field.name]?.message}</p>}
                </div>
              ))}

              <div>
                <label className="tech-label block mb-2">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Describe your event..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm resize-none"
                  />
                </div>
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20">
              {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Create Event</>}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
