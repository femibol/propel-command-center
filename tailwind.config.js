/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#1A1D27', hover: '#242836' },
        border: '#2E3348',
        'text-primary': '#E8E9ED',
        'text-secondary': '#8B8FA3',
        'text-muted': '#5C6178',
        priority: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#6B7280',
        },
        status: {
          progress: '#3B82F6',
          waiting: '#A855F7',
          new: '#6B7280',
          review: '#8B5CF6',
          done: '#22C55E',
        },
        stale: { warn: '#FBBF24', critical: '#EF4444' },
        accent: '#3B82F6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
