/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#e6f2f0',
          200: '#c0e0db',
          300: '#8fcdc5',
          400: '#4db7aa',
          500: '#017a5a', // Main primary color
          600: '#00655a',
          700: '#00524c', // Darker shade
          800: '#003e39',
          900: '#002926',
        },
        secondary: {
          100: '#e6f5f2',
          200: '#c0e6df',
          300: '#8fd4c7',
          400: '#4dc0ab',
          500: '#008c7e', // Main secondary color
          600: '#007d71',
          700: '#006a60',
          800: '#00504a',
          900: '#003733',
        },
      },
    },
  },
  plugins: [],
} 