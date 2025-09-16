/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e9f9ee',
          100: '#d1f2d9',
          200: '#a3e5b3',
          300: '#75d88d',
          400: '#47cb67',
          500: '#25D366',
          600: '#1ea952',
          700: '#177f3e',
          800: '#10552a',
          900: '#082b15',
        },
      },
    },
  },
  plugins: [],
}
