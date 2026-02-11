/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#f5f1e8',
        'dark': '#2d2d2d',
        'accent': '#ff6b3f',
        'primary': '#ff6b3f',
        'secondary': '#2d2d2d',
        'team-a': '#ff6b3f',
        'team-b': '#2d2d2d',
      },
      fontFamily: {
        'serif': ['Georgia', 'Times New Roman', 'serif'],
        'sans': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
