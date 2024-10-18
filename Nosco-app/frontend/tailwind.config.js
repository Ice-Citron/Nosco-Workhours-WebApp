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
        'nosco-red-dark': '#8A1728',
        'nosco-light-gray': '#F0F0F0', // Light gray for content background
        'nosco-text': '#333333', // Dark gray for text
      },
      backgroundImage: {
        'nosco-gradient': 'linear-gradient(to bottom, #A52A2A, #8B0000)',
      },
    },
  },
  plugins: [],
}