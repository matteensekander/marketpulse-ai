export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a0e1a',
        'navy-light': '#111827',
        'navy-card': '#161d2e',
        'navy-border': '#1e2d45',
        bull: '#00ff88',
        bear: '#ff3b3b',
        gold: '#f5c518',
        muted: '#4b6080'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
