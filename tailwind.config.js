/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- Garante que esta linha está presente
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
