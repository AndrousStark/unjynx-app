'use client';

import { useEffect, useState } from 'react';

interface RingData {
  readonly label: string;
  readonly value: number;  // 0-100
  readonly color: string;
  readonly radius: number;
}

interface ProgressRingsProps {
  readonly tasks: number;
  readonly focus: number;
  readonly habits: number;
}

function AnimatedRing({ label, value, color, radius }: RingData) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  const center = 60; // SVG center

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <>
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="6"
        opacity="0.3"
      />
      {/* Progress ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-1000 ease-out"
      />
    </>
  );
}

export function ProgressRings({ tasks, focus, habits }: ProgressRingsProps) {
  const rings: readonly RingData[] = [
    { label: 'Tasks', value: tasks, color: '#FFD700', radius: 50 },
    { label: 'Focus', value: focus, color: '#6C3CE0', radius: 40 },
    { label: 'Habits', value: habits, color: '#00C896', radius: 30 },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
        Daily Progress
      </h3>
      <div className="flex items-center gap-6">
        {/* SVG Rings */}
        <div className="flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {rings.map((ring) => (
              <AnimatedRing key={ring.label} {...ring} />
            ))}
            {/* Center text */}
            <text
              x="60"
              y="56"
              textAnchor="middle"
              className="fill-[var(--foreground)] text-lg font-bebas"
              fontSize="20"
            >
              {Math.round((tasks + focus + habits) / 3)}%
            </text>
            <text
              x="60"
              y="70"
              textAnchor="middle"
              className="fill-[var(--muted-foreground)]"
              fontSize="8"
            >
              OVERALL
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {rings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: ring.color }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{ring.value}%</p>
                <p className="text-xs text-[var(--muted-foreground)]">{ring.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
