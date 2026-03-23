import { cn } from '@/lib/utils/cn';

// ─── Auth Layout ────────────────────────────────────────────────
//
// Full-screen centered card on an animated gradient background.
// Used for login, signup, forgot-password, and callback routes.
//

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* ── Animated gradient background ── */}
      <div className="fixed inset-0 -z-10 auth-gradient-bg" />

      {/* ── Subtle radial glow overlay ── */}
      <div
        className="fixed inset-0 -z-[5] opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(108,60,224,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,215,0,0.1) 0%, transparent 60%)',
        }}
      />

      {/* ── Floating particles (decorative) ── */}
      <div className="fixed inset-0 -z-[4] pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-unjynx-violet/5 blur-3xl animate-float" />
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-unjynx-gold/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[60%] left-[60%] w-32 h-32 rounded-full bg-unjynx-violet/3 blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* ── Logo ── */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#F5A623] flex items-center justify-center shadow-xl shadow-[#FFD700]/20">
            <span className="font-bebas text-3xl text-[#0F0A1A] leading-none tracking-wider select-none">
              U
            </span>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FFD700] animate-pulse-gold" />
        </div>
        <h1 className="font-bebas text-3xl tracking-[0.3em] text-white select-none">
          UNJYNX
        </h1>
        <p className="mt-1.5 text-sm text-[#B8A9D4] font-dm-sans tracking-wide">
          Break the satisfactory.
        </p>
      </div>

      {/* ── Card container ── */}
      <div
        className={cn(
          'w-full max-w-[440px]',
          'bg-[#1E1333]/80 backdrop-blur-xl',
          'border border-[#2D1F4E]',
          'rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]',
          'overflow-hidden',
          'animate-slide-up',
        )}
      >
        {children}
      </div>

      {/* ── Footer ── */}
      <p className="mt-8 text-xs text-[#6B5B8A] text-center animate-fade-in">
        By METAminds &middot; Privacy Policy &middot; Terms of Service
      </p>
    </div>
  );
}
