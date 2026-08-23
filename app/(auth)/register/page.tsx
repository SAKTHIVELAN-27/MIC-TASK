'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, User, Mail, Lock, Shield, Users } from 'lucide-react';
import { signIn } from 'next-auth/react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ATTENDEE', 'ORGANIZER']),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ATTENDEE' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Registration failed');
        return;
      }
      // Auto sign-in
      await signIn('credentials', { email: data.email, password: data.password, redirect: false });
      window.location.href = data.role === 'ORGANIZER' ? '/dashboard' : '/my-events';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 glow-bg" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white">EventSync</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join the event infrastructure platform</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-cyan-500/10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </motion.div>
            )}

            {/* Role selector */}
            <div>
              <label className="tech-label block mb-3">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['ATTENDEE', 'ORGANIZER'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue('role', role)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      selectedRole === role
                        ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {role === 'ATTENDEE' ? <Users className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    <span className="text-xs font-semibold">{role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="tech-label block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input {...register('name')} placeholder="Arun Kumar" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="tech-label block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input {...register('email')} type="email" placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="tech-label block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="min. 6 characters" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20">
              {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">Already have an account?{' '}<Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
