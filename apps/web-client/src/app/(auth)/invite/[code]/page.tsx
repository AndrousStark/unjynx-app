"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users, Check, Loader2, Copy, LogIn } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.unjynx.me";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.code as string;
  const { user, isAuthenticated, token } = useAuth();

  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAccept = async () => {
    if (isAccepting || !token) return;
    setIsAccepting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/orgs/accept-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();

      if (data.success) {
        setAccepted(true);
        setOrgInfo(data.data);
        setTimeout(() => router.push("/"), 2500);
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setIsAccepting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            accepted ? "bg-unjynx-emerald/15" : "bg-unjynx-violet/15"
          }`}
        >
          {accepted ? (
            <Check className="w-7 h-7 text-unjynx-emerald" />
          ) : (
            <Users className="w-7 h-7 text-unjynx-violet" />
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="font-outfit text-2xl font-bold text-[var(--foreground)] mb-2">
        {accepted ? "Welcome Aboard!" : "You're Invited!"}
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        {accepted
          ? "Redirecting to your workspace..."
          : "You've been invited to join an organization"}
      </p>

      {/* Org info card (after accept) */}
      {orgInfo && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--input)] border border-[var(--border)] text-left animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-unjynx-violet to-unjynx-gold flex items-center justify-center text-white font-bold text-lg">
              {((orgInfo.orgName as string) || "O")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                {(orgInfo.orgName as string) || "Organization"}
              </p>
              <p className="text-xs text-unjynx-gold font-medium">
                Role: {(orgInfo.role as string) || "member"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!accepted && (
        <>
          {/* Invite code display */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] flex items-center gap-3">
            <span className="flex-1 text-left font-mono text-sm tracking-wider text-[var(--foreground)]">
              {inviteCode}
            </span>
            <button
              onClick={copyCode}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-unjynx-emerald" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-unjynx-rose/10 border border-unjynx-rose/20 text-sm text-unjynx-rose animate-slide-up">
              {error}
            </div>
          )}

          {/* Action buttons */}
          {isAuthenticated ? (
            <>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full h-11 rounded-xl bg-unjynx-violet hover:bg-unjynx-violet-hover text-white font-semibold text-sm
                  flex items-center justify-center gap-2 transition-all duration-150
                  shadow-sm hover:shadow-lg hover:shadow-unjynx-violet/20
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept & Join
              </button>

              <button
                onClick={() => router.push("/")}
                className="mt-3 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Decline
              </button>

              {user && (
                <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                  Signed in as{" "}
                  <span className="text-unjynx-gold font-medium">
                    {user.email}
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 px-4 py-3 rounded-xl bg-unjynx-violet/10 border border-unjynx-violet/20 text-sm text-[var(--foreground)]">
                Sign in or create an account to accept this invitation.
              </div>

              <button
                onClick={() =>
                  router.push(`/login?redirect=/invite/${inviteCode}`)
                }
                className="w-full h-11 rounded-xl bg-unjynx-violet hover:bg-unjynx-violet-hover text-white font-semibold text-sm
                  flex items-center justify-center gap-2 transition-all duration-150
                  shadow-sm hover:shadow-lg hover:shadow-unjynx-violet/20"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Accept
              </button>

              <button
                onClick={() =>
                  router.push(`/signup?redirect=/invite/${inviteCode}`)
                }
                className="mt-3 text-sm text-unjynx-gold hover:text-unjynx-gold-rich font-medium transition-colors"
              >
                Create account instead
              </button>
            </>
          )}
        </>
      )}

      {/* Success progress bar */}
      {accepted && (
        <div className="mt-6 h-1 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-unjynx-emerald rounded-full animate-[shimmer_1.5s_infinite]"
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}
