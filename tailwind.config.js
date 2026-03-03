/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#f472b6',
      }
    }
  },
  plugins: [],
}
