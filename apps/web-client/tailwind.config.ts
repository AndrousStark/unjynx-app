import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'unjynx-midnight': '#0F0A1A',
        'unjynx-deep-purple': '#1A0F2E',
        'unjynx-violet': '#6C3CE0',
        'unjynx-violet-hover': '#7C4FF0',
        'unjynx-gold': '#FFD700',
        'unjynx-gold-dark': '#B8860B',
        'unjynx-gold-rich': '#F5A623',
        'unjynx-gold-muted': '#E6C200',
        'unjynx-emerald': '#00C896',
        'unjynx-amber': '#FF9F1C',
        'unjynx-rose': '#FF6B8A',
        'unjynx-lavender': '#B8A9D4',
        'unjynx-purple-mist': '#2D1B4E',
        'unjynx-soft-lavender': '#F8F5FF',
        'unjynx-surface-dark': '#1E1333',
        'unjynx-surface-darker': '#150E24',
        'unjynx-surface-light': '#F3EEFF',
        'unjynx-border-dark': '#2D1F4E',
        'unjynx-border-light': '#E0D5F5',
        'unjynx-text-primary-dark': '#F0EBF7',
        'unjynx-text-secondary-dark': '#9B8BB8',
        'unjynx-text-primary-light': '#1A0F2E',
        'unjynx-text-secondary-light': '#6B5B8A',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'Bebas Neue', 'cursive'],
        playfair: ['Playfair Display', 'serif'],
      },
      spacing: {
        'sidebar-expanded': '256px',
        'sidebar-collapsed': '64px',
        'detail-panel': '480px',
        'navbar-h': '64px',
        'views-bar-h': '48px',
      },
      boxShadow: {
        'unjynx-glow': '0 0 20px rgba(108, 60, 224, 0.15)',
        'unjynx-gold-glow': '0 0 20px rgba(255, 215, 0, 0.15)',
        'unjynx-card-dark': '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(108, 60, 224, 0.08)',
        'unjynx-card-light': '0 4px 24px rgba(26, 15, 46, 0.06), 0 0 0 1px rgba(108, 60, 224, 0.06)',
        'unjynx-panel': '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(108, 60, 224, 0.1)',
      },
      backdropBlur: {
        'unjynx': '20px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 215, 0, 0)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'progress-ring': {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--ring-offset)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-right': 'slide-out-right 0.2s ease-in',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-left': 'slide-out-left 0.2s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'progress-ring': 'progress-ring 1s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      transitionDuration: {
        'sidebar': '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
