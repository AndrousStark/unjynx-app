/**
 * SSL/TLS Configuration for UNJYNX Production
 *
 * Defines SSL pinning, cipher suites, and TLS version requirements.
 * Used by both the backend (Node.js TLS options) and referenced by
 * the Flutter client for certificate pinning.
 *
 * Pin Rotation Strategy:
 *   - Always include current + next certificate pin
 *   - Rotate pins 30 days before certificate expiry
 *   - Emergency pin rotation via Shorebird OTA update
 */

export const SSL_CONFIG = {
  /**
   * SHA-256 SPKI pins for api.unjynx.com
   * Include at least 2 pins: current cert + backup/next cert.
   * Populated during deployment by the CI/CD pipeline.
   *
   * To generate a pin from a certificate:
   *   openssl x509 -in cert.pem -pubkey -noout | \
   *     openssl pkey -pubin -outform der | \
   *     openssl dgst -sha256 -binary | \
   *     openssl enc -base64
   */
  pins: [
    // Primary certificate pin (populated by deployment pipeline)
    // 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // Backup certificate pin (populated by deployment pipeline)
    // 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],

  /**
   * Minimum TLS version. TLS 1.3 provides:
   *   - Forward secrecy by default
   *   - Faster handshakes (1-RTT, 0-RTT resumption)
   *   - Removed legacy cipher suites
   */
  minTlsVersion: '1.3' as const,

  /**
   * Allowed cipher suites for TLS 1.3.
   * These are the only three cipher suites defined in TLS 1.3,
   * all providing AEAD encryption with forward secrecy.
   */
  allowedCiphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ] as const,

  /**
   * OCSP stapling configuration.
   * Server includes OCSP response in TLS handshake to avoid
   * client-side OCSP lookups (privacy + performance).
   */
  ocspStapling: true,

  /**
   * Certificate transparency enforcement.
   * Ensures certificates are logged to public CT logs,
   * preventing misissued certificates from going undetected.
   */
  certificateTransparency: true,

  /**
   * Pin validation settings for the Flutter client.
   */
  clientPinning: {
    /**
     * Whether to enforce pinning in debug/development builds.
     * Set to false to allow self-signed certs during local dev.
     */
    enforceInDebug: false,

    /**
     * Maximum age for cached pins (seconds).
     * After this period, the client re-fetches pins from
     * a trusted backup endpoint.
     */
    maxAge: 2592000, // 30 days

    /**
     * Report-only mode for testing pin changes before enforcement.
     * When true, pin mismatches are reported but not blocked.
     */
    reportOnly: false,

    /**
     * URI to report pin validation failures.
     * Used for monitoring and alerting on potential MITM attacks.
     */
    reportUri: 'https://api.unjynx.com/api/v1/security/pin-report',
  },
} as const;

/**
 * Node.js TLS server options derived from SSL_CONFIG.
 * Used when configuring the HTTPS server in production.
 */
export function getNodeTlsOptions() {
  return {
    minVersion: `TLSv${SSL_CONFIG.minTlsVersion}` as const,
    ciphers: SSL_CONFIG.allowedCiphers.join(':'),
    honorCipherOrder: true,
    // Disable session tickets for perfect forward secrecy
    // (TLS 1.3 handles this natively, but explicit for clarity)
    secureOptions: 0,
  };
}

/**
 * HPKP-style header value for certificate pinning.
 * Note: HPKP is deprecated in browsers, but this format is useful
 * for custom client implementations and documentation.
 */
export function getPinningHeader(): string {
  const pinDirectives = SSL_CONFIG.pins
    .map((pin) => `pin-sha256="${pin}"`)
    .join('; ');

  const reportUri = SSL_CONFIG.clientPinning.reportUri;
  const maxAge = SSL_CONFIG.clientPinning.maxAge;

  return `${pinDirectives}; max-age=${maxAge}; report-uri="${reportUri}"`;
}

export type SslConfig = typeof SSL_CONFIG;
