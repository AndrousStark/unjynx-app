"use client";

import { useState, useEffect } from "react";
import { Shield, Check, AlertTriangle, Loader2, ExternalLink, Lock } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.unjynx.me";

interface SsoConfig {
  provider: string | null;
  domain: string | null;
  domainVerified: boolean;
  enforced: boolean;
  metadata: Record<string, unknown>;
}

export default function SsoSettingsPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [provider, setProvider] = useState<"saml" | "oidc">("saml");
  const [domain, setDomain] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/enterprise/sso/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
        if (data.data.provider) setProvider(data.data.provider);
        if (data.data.domain) setDomain(data.data.domain);
        if (data.data.metadata?.metadataUrl) setMetadataUrl(data.data.metadata.metadataUrl as string);
      }
    } catch {
      // Graceful
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!domain) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/enterprise/sso/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider, domain, metadataUrl: metadataUrl || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchConfig();
      } else {
        setError(data.error || "Failed to configure SSO");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/enterprise/sso/verify-domain`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchConfig();
    } catch {
      setError("Verification failed");
    }
  };

  const handleToggleEnforce = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/enterprise/sso/enforce`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enforce: !config?.enforced }),
      });
      await fetchConfig();
    } catch {
      setError("Failed to update enforcement");
    }
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
        <div className="w-10 h-10 rounded-xl bg-unjynx-violet/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-unjynx-violet" />
        </div>
        <div>
          <h1 className="text-xl font-outfit font-bold text-[var(--foreground)]">Single Sign-On</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Configure SAML or OIDC for your organization</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-unjynx-rose/10 border border-unjynx-rose/20 text-sm text-unjynx-rose animate-slide-up">
          {error}
        </div>
      )}

      {/* Status card */}
      {config?.provider && (
        <div className="p-4 rounded-xl bg-[var(--input)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.domainVerified ? (
                <Check className="w-5 h-5 text-unjynx-emerald" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-unjynx-amber" />
              )}
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {config.provider.toUpperCase()} — {config.domain}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {config.domainVerified ? "Domain verified" : "Domain not verified"}
                  {config.enforced ? " · SSO enforced" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure form */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Provider</h2>
        <div className="flex gap-3">
          {(["saml", "oidc"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                provider === p
                  ? "bg-unjynx-violet text-white"
                  : "bg-[var(--input)] border border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Email Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="company.com"
            className="w-full h-11 px-4 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-unjynx-gold/40 focus:border-unjynx-gold outline-none transition-all"
          />
        </div>

        {provider === "saml" && (
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">SAML Metadata URL</label>
            <input
              type="url"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              placeholder="https://your-idp.com/app/metadata.xml"
              className="w-full h-11 px-4 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-unjynx-gold/40 focus:border-unjynx-gold outline-none transition-all"
            />
          </div>
        )}

        <button
          onClick={handleConfigure}
          disabled={isSaving || !domain}
          className="w-full h-11 rounded-xl bg-unjynx-violet hover:bg-unjynx-violet-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {config?.provider ? "Update SSO" : "Configure SSO"}
        </button>
      </div>

      {/* Domain verification */}
      {config?.provider && !config.domainVerified && (
        <div className="p-4 rounded-xl bg-unjynx-amber/10 border border-unjynx-amber/20 space-y-3">
          <p className="text-sm text-unjynx-amber font-medium">Domain verification required</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Verify ownership of <strong>{config.domain}</strong> to enable SSO enforcement.
          </p>
          <button
            onClick={handleVerifyDomain}
            className="px-4 py-2 rounded-lg bg-unjynx-amber/20 text-unjynx-amber text-sm font-medium hover:bg-unjynx-amber/30 transition-colors"
          >
            Verify Domain
          </button>
        </div>
      )}

      {/* Enforcement toggle */}
      {config?.provider && config.domainVerified && (
        <div className="p-4 rounded-xl bg-[var(--input)] border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[var(--muted-foreground)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Enforce SSO</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Require all @{config.domain} users to sign in via SSO
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEnforce}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enforced ? "bg-unjynx-emerald" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                config.enforced ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      {/* Help link */}
      <a
        href="https://docs.unjynx.me/enterprise/sso"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        SSO setup documentation
      </a>
    </div>
  );
}
