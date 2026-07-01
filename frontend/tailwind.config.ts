import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#16150F',
          soft: '#3A3A32',
          muted: '#6B6B60',
        },
        paper: {
          DEFAULT: '#FAFAF7',
          raised: '#FFFFFF',
          sunk: '#F1F0EA',
        },
        filament: {
          DEFAULT: '#E8590C',
          soft: '#F08B4C',
          wash: '#FBEDE2',
        },
        blueprint: {
          DEFAULT: '#3A4A5A',
          soft: '#7C8A98',
          wash: '#EAEEF1',
        },
        line: {
          DEFAULT: 'rgba(22,21,15,0.10)',
          strong: 'rgba(22,21,15,0.18)',
        },
      },
      fontFamily: {
        sans: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
