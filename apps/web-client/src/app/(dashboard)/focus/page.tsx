'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Star,
  Zap,
  Clock,
  Target,
  Trophy,
  Flame,
  ChevronRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface PomodoroSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  durationMinutes: number;
  focusRating: number | null;
  startedAt: string;
  completedAt: string | null;
  status: 'active' | 'completed' | 'abandoned';
}

interface PomodoroStats {
  today: { sessions: number; totalMinutes: number; avgFocusRating: number | null };
  week: { sessions: number; totalMinutes: number; avgFocusRating: number | null };
  streak: number;
  peakHour: number | null;
  totalLifetime: number;
}

interface NextSuggestion {
  taskId: string;
  taskTitle: string;
  priority: string;
  estimatedPomodoros: number;
  reason: string;
}

// ─── API ────────────────────────────────────────────────────────

function startPomodoro(taskId?: string, duration?: number) {
  return apiClient.post<PomodoroSession>('/api/v1/pomodoro/start', { taskId, durationMinutes: duration });
}
function completePomodoro(focusRating?: number) {
  return apiClient.post<PomodoroSession>('/api/v1/pomodoro/complete', { focusRating });
}
function abandonPomodoro() {
  return apiClient.post('/api/v1/pomodoro/abandon');
}
function getStats() {
  return apiClient.get<PomodoroStats>('/api/v1/pomodoro/stats');
}
function getNextSuggestion() {
  return apiClient.get<NextSuggestion | null>('/api/v1/pomodoro/suggest');
}

// ─── Timer Ring SVG ─────────────────────────────────────────────

function TimerRing({ progress, size = 280 }: { progress: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border)" strokeWidth={stroke}
        opacity={0.3}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="url(#timerGradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
      <defs>
        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Focus Rating Stars ─────────────────────────────────────────

function FocusRating({ onRate }: { onRate: (rating: number) => void }) {
  const [hovering, setHovering] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHovering(n)}
          onMouseLeave={() => setHovering(0)}
          onClick={() => { setSelected(n); onRate(n); }}
          className="p-1 transition-transform hover:scale-125"
        >
          <Star
            size={28}
            className={cn(
              'transition-colors',
              (hovering >= n || selected >= n)
                ? 'text-unjynx-gold fill-unjynx-gold'
                : 'text-[var(--muted-foreground)]',
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function FocusPage() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<'idle' | 'running' | 'break' | 'rating'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSession, setActiveSession] = useState<PomodoroSession | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitle = useRef<string>('');

  const { data: stats } = useQuery({ queryKey: ['pomodoro', 'stats'], queryFn: getStats, staleTime: 30_000 });
  const { data: suggestion } = useQuery({ queryKey: ['pomodoro', 'suggest'], queryFn: getNextSuggestion, staleTime: 60_000, enabled: phase === 'idle' });

  const startMutation = useMutation({
    mutationFn: (args: { taskId?: string; duration?: number }) => startPomodoro(args.taskId, args.duration),
    onSuccess: (session) => {
      setActiveSession(session);
      setTotalSeconds(session.durationMinutes * 60);
      setSecondsLeft(session.durationMinutes * 60);
      setPhase('running');
      setIsPaused(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (rating?: number) => completePomodoro(rating),
    onSuccess: () => {
      setSessionCount((p) => p + 1);
      setPhase('break');
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['pomodoro'] });
      // Break timer: 5 min normally, 15 min after every 4th session
      const breakMin = (sessionCount + 1) % 4 === 0 ? 15 : 5;
      setTotalSeconds(breakMin * 60);
      setSecondsLeft(breakMin * 60);
    },
  });

  // Timer countdown
  useEffect(() => {
    if (phase === 'running' && !isPaused && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            // Timer done — go to rating
            setPhase('rating');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    if (phase === 'break' && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, isPaused, secondsLeft]);

  // Browser tab title timer
  useEffect(() => {
    if (phase === 'running' && !isPaused) {
      originalTitle.current = originalTitle.current || document.title;
      const min = Math.floor(secondsLeft / 60);
      const sec = secondsLeft % 60;
      const taskName = activeSession?.taskTitle ?? 'Focus';
      document.title = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')} — ${taskName} | UNJYNX`;
    } else if (phase === 'idle') {
      if (originalTitle.current) document.title = originalTitle.current;
    }
  }, [secondsLeft, phase, isPaused, activeSession?.taskTitle]);

  // Clean up title on unmount
  useEffect(() => () => {
    if (originalTitle.current) document.title = originalTitle.current;
  }, []);

  const handleStart = useCallback((taskId?: string, duration?: number) => {
    startMutation.mutate({ taskId, duration: duration ?? 25 });
  }, [startMutation]);

  const handleRate = useCallback((rating: number) => {
    completeMutation.mutate(rating);
  }, [completeMutation]);

  const handleAbandon = useCallback(() => {
    abandonPomodoro();
    setPhase('idle');
    setActiveSession(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleSkipBreak = useCallback(() => {
    setPhase('idle');
    setSecondsLeft(25 * 60);
    setTotalSeconds(25 * 60);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? 1 - (secondsLeft / totalSeconds) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] animate-fade-in">

      {/* Idle State */}
      {phase === 'idle' && (
        <div className="text-center space-y-6">
          {/* Stats bar */}
          {stats && (
            <div className="flex items-center justify-center gap-6 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><Clock size={12} />{stats.today.sessions} sessions today</span>
              <span className="flex items-center gap-1"><Target size={12} />{stats.today.totalMinutes}min focused</span>
              {stats.streak > 0 && <span className="flex items-center gap-1"><Flame size={12} className="text-amber-400" />{stats.streak}d streak</span>}
            </div>
          )}

          {/* Timer display (idle) */}
          <div className="relative inline-flex items-center justify-center">
            <TimerRing progress={0} />
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-outfit font-bold text-[var(--foreground)] tabular-nums">25:00</span>
              <span className="text-xs text-[var(--muted-foreground)] mt-1">Ready to focus</span>
            </div>
          </div>

          {/* AI Suggestion */}
          {suggestion && (
            <button
              onClick={() => handleStart(suggestion.taskId)}
              className="flex items-center gap-3 mx-auto px-4 py-3 rounded-xl border border-unjynx-violet/20 bg-unjynx-violet/5 hover:bg-unjynx-violet/10 transition-colors max-w-sm"
            >
              <Zap size={16} className="text-unjynx-violet flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--foreground)]">{suggestion.taskTitle}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  AI suggests • {suggestion.reason} • ~{suggestion.estimatedPomodoros} pomodoro{suggestion.estimatedPomodoros !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
            </button>
          )}

          {/* Start buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => handleStart(suggestion?.taskId)}
              size="lg"
              className="bg-gradient-to-r from-unjynx-violet to-purple-600 hover:opacity-90 px-8"
            >
              <Play size={18} className="mr-2" />
              Start Focus
            </Button>
          </div>

          {/* Duration options */}
          <div className="flex items-center justify-center gap-2">
            {[15, 25, 50, 90].map((d) => (
              <button
                key={d}
                onClick={() => handleStart(suggestion?.taskId, d)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-colors',
                  d === 25
                    ? 'border-unjynx-violet/50 text-unjynx-violet bg-unjynx-violet/5'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {d}min
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Running State */}
      {phase === 'running' && (
        <div className="text-center space-y-6">
          {/* Task title */}
          {activeSession?.taskTitle && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Focusing on <span className="text-[var(--foreground)] font-medium">{activeSession.taskTitle}</span>
            </p>
          )}

          {/* Timer */}
          <div className="relative inline-flex items-center justify-center">
            <TimerRing progress={progress} />
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-outfit font-bold text-[var(--foreground)] tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-[var(--muted-foreground)] mt-1">
                {isPaused ? 'Paused' : 'Focusing...'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleAbandon}
              className="w-12 h-12 rounded-full text-rose-400 hover:bg-rose-500/10"
              title="Abandon"
            >
              <Square size={18} />
            </Button>
            <Button
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-unjynx-violet to-purple-600 hover:opacity-90"
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSecondsLeft(0); setPhase('rating'); }}
              className="w-12 h-12 rounded-full"
              title="Finish early"
            >
              <SkipForward size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Rating State */}
      {phase === 'rating' && (
        <div className="text-center space-y-6 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <Trophy size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-bold text-[var(--foreground)]">Session complete!</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {activeSession?.durationMinutes ?? 25} minutes of focused work. How was your focus?
            </p>
          </div>
          <FocusRating onRate={handleRate} />
        </div>
      )}

      {/* Break State */}
      {phase === 'break' && (
        <div className="text-center space-y-6 animate-fade-in">
          {/* Break timer */}
          <div className="relative inline-flex items-center justify-center">
            <TimerRing progress={totalSeconds > 0 ? 1 - (secondsLeft / totalSeconds) : 0} size={200} />
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-outfit font-bold text-emerald-400 tabular-nums">
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
              <span className="text-xs text-[var(--muted-foreground)] mt-1">Break time</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[var(--muted-foreground)]">
              {(sessionCount) % 4 === 0 ? '🎉 Long break — you earned it!' : 'Stand up, stretch, drink water.'}
            </p>
            {stats && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {stats.today.sessions + 1} sessions today • {stats.today.totalMinutes + (activeSession?.durationMinutes ?? 25)}min focused
              </p>
            )}
          </div>

          <Button variant="outline" onClick={handleSkipBreak}>
            Skip break — I&apos;m ready
          </Button>
        </div>
      )}
    </div>
  );
}
