/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          vinyl: {
            dark: '#1a1a1a',
            purple: '#8b5cf6',
            gold: '#fbbf24',
          }
        }
      },
    },
    plugins: [],
  }
  