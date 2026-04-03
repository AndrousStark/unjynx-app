"use client";

import { useState, useEffect } from "react";
import { Key, Copy, Check, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.unjynx.me";

export default function ScimSettingsPage() {
  const { token } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<"token" | "url" | null>(null);

  useEffect(() => {
    // Check current SCIM status from org config
    setIsLoading(false);
  }, []);

  const handleEnable = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/enterprise/scim/enable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNewToken(data.data.token);
        setBaseUrl(data.data.baseUrl);
        setIsEnabled(true);
      }
    } catch {
      // Error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDisable = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/enterprise/scim/disable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEnabled(false);
      setNewToken(null);
    } catch {
      // Error
    }
  };

  const copyToClipboard = (text: string, type: "token" | "url") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-unjynx-violet" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-unjynx-gold/15 flex items-center justify-center">
          <Key className="w-5 h-5 text-unjynx-gold" />
        </div>
        <div>
          <h1 className="text-xl font-outfit font-bold text-[var(--foreground)]">SCIM Provisioning</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Automatic user sync with your identity provider</p>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 rounded-xl bg-[var(--input)] border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? "bg-unjynx-emerald" : "bg-[var(--muted-foreground)]"}`} />
            <p className="font-semibold text-[var(--foreground)]">
              {isEnabled ? "SCIM Enabled" : "SCIM Disabled"}
            </p>
          </div>
          <button
            onClick={isEnabled ? handleDisable : handleEnable}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isEnabled
                ? "bg-unjynx-rose/15 text-unjynx-rose hover:bg-unjynx-rose/25"
                : "bg-unjynx-violet text-white hover:bg-unjynx-violet-hover"
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEnabled ? (
              "Disable"
            ) : (
              "Enable SCIM"
            )}
          </button>
        </div>
      </div>

      {/* Token display (shown once) */}
      {newToken && (
        <div className="space-y-4 animate-slide-up">
          <div className="p-4 rounded-xl bg-unjynx-amber/10 border border-unjynx-amber/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-unjynx-amber mt-0.5" />
              <p className="text-sm text-unjynx-amber">
                Copy this token now — it won&apos;t be shown again.
              </p>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">SCIM Base URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={baseUrl}
                className="flex-1 h-11 px-4 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(baseUrl, "url")}
                className="h-11 px-3 rounded-xl bg-[var(--input)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
              >
                {copied === "url" ? (
                  <Check className="w-4 h-4 text-unjynx-emerald" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
              </button>
            </div>
          </div>

          {/* Bearer Token */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Bearer Token</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newToken}
                className="flex-1 h-11 px-4 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(newToken, "token")}
                className="h-11 px-3 rounded-xl bg-[var(--input)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
              >
                {copied === "token" ? (
                  <Check className="w-4 h-4 text-unjynx-emerald" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {isEnabled && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Setup in your Identity Provider</h2>
          <ol className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-unjynx-gold font-bold">1.</span>
              Go to your IdP&apos;s provisioning settings (Okta, Azure AD, etc.)
            </li>
            <li className="flex gap-2">
              <span className="text-unjynx-gold font-bold">2.</span>
              Set the SCIM Base URL to the URL above
            </li>
            <li className="flex gap-2">
              <span className="text-unjynx-gold font-bold">3.</span>
              Set authentication to &quot;Bearer Token&quot; and paste the token
            </li>
            <li className="flex gap-2">
              <span className="text-unjynx-gold font-bold">4.</span>
              Enable &quot;Create Users&quot;, &quot;Update Users&quot;, &quot;Deactivate Users&quot;
            </li>
            <li className="flex gap-2">
              <span className="text-unjynx-gold font-bold">5.</span>
              Test the connection and assign users to the UNJYNX app
            </li>
          </ol>
        </div>
      )}

      {/* Help */}
      <a
        href="https://docs.unjynx.me/enterprise/scim"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        SCIM provisioning documentation
      </a>
    </div>
  );
}
