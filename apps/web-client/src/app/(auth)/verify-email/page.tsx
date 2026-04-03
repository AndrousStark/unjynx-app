"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Check, Loader2, RotateCcw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.unjynx.me";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-verify when all 6 digits entered
  const verify = useCallback(
    async (fullCode: string) => {
      if (fullCode.length !== 6 || isVerifying) return;
      setIsVerifying(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: fullCode }),
        });
        const data = await res.json();

        if (data.success) {
          setVerified(true);
          setTimeout(() => router.push("/"), 2000);
        } else {
          setError(data.error || "Invalid or expired code");
          setCode(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }
      } catch {
        setError("Network error. Please try again.");
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsVerifying(false);
      }
    },
    [email, isVerifying, router]
  );

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      verify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      verify(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const resend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await fetch(`${API_BASE}/api/v1/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCooldown(60);
    } catch {
      // Silently fail
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            verified ? "bg-unjynx-emerald/15" : "bg-unjynx-violet/15"
          }`}
        >
          {verified ? (
            <Check className="w-7 h-7 text-unjynx-emerald" />
          ) : (
            <Mail className="w-7 h-7 text-unjynx-violet" />
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="font-outfit text-2xl font-bold text-[var(--foreground)] mb-2">
        {verified ? "Email Verified!" : "Verify Your Email"}
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-1">
        {verified
          ? "Redirecting you to the app..."
          : "Enter the 6-digit code sent to"}
      </p>
      {!verified && (
        <p className="text-sm font-semibold text-unjynx-gold mb-8">{email}</p>
      )}

      {/* OTP Boxes */}
      {!verified && (
        <>
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150
                  bg-[var(--input)] text-[var(--foreground)]
                  ${
                    error
                      ? "border-unjynx-rose focus:ring-unjynx-rose/40"
                      : "border-[var(--border)] focus:border-unjynx-gold focus:ring-2 focus:ring-unjynx-gold/40"
                  }
                  outline-none
                  ${i === 2 ? "mr-3" : ""}
                `}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-unjynx-rose mb-4 animate-slide-up">
              {error}
            </p>
          )}

          {/* Loading */}
          {isVerifying && (
            <div className="flex justify-center mb-4">
              <Loader2 className="w-6 h-6 text-unjynx-violet animate-spin" />
            </div>
          )}

          {/* Resend */}
          <button
            onClick={resend}
            disabled={cooldown > 0 || isResending}
            className="text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? (
              <span className="text-[var(--muted-foreground)]">
                Resend code in {cooldown}s
              </span>
            ) : (
              <span className="text-unjynx-violet hover:text-unjynx-violet-hover font-medium inline-flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Resend verification code
              </span>
            )}
          </button>

          {/* Skip */}
          <div className="mt-6">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        </>
      )}

      {/* Success state */}
      {verified && (
        <div className="mt-6">
          <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-unjynx-emerald rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}
