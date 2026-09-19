/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#0c2a47',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: '#1f2937',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
              '&:visited': {
                color: '#7c3aed',
              },
            },
            code: {
              backgroundColor: '#f3f4f6',
              color: '#111827',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  safelist: [
    {
      pattern: /^(bg|text|border)-(brand|danger|success)-(50|500|600|700|900)$/,
    },
    {
      pattern: /^(ring|outline)-(brand|danger|success)-(500|600)$/,
    },
  ],
};
