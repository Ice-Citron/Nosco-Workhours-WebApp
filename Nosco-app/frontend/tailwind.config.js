/** @type {import('tailwindcss').Config} */


module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nosco-red': '#8B0000', // Dark red color from the original site
        'nosco-red-light': '#A52A2A', // Lighter red for gradient
      },
      backgroundImage: {
        'nosco-gradient': 'linear-gradient(to bottom, #A52A2A, #8B0000)',
      },
    },
  },
  plugins: [],
}