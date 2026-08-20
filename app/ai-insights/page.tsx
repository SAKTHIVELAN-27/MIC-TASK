import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { Brain, ArrowRight, Calendar, MapPin, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AIInsightsSelectPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id, status: { not: 'CANCELLED' } },
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { date: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="tech-label mb-1">Google Gemini 1.5 Flash</div>
          <h1 className="text-3xl font-black text-white">AI Event Insights</h1>
          <p className="text-gray-400 text-sm mt-1">
            Ask natural-language questions about check-in velocity, peak arrival windows, and no-show distributions.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 text-center">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Events Found</h3>
            <p className="text-gray-400 text-sm mb-6">Create an event to query AI insights.</p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="glass rounded-2xl border border-white/8 hover:border-cyan-500/30 transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-xs font-mono">Gemini Context Ready</span>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-2 truncate">{event.name}</h3>

                  <div className="space-y-1.5 text-xs text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400/60" />
                      <span>{formatDate(event.date)} · {event.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400/60" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/ai-insights/${event.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  <Brain className="w-4 h-4 text-cyan-400" /> Ask AI Insights <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
