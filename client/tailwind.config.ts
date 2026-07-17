/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-primary, #2879b6)',
          light: 'var(--color-primary-light, #1D9AD4)',
          dark: 'var(--color-primary-dark, #235EAC)',
        },
        success: 'var(--color-secondary, #7dc244)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius-lg, 12px)',
      },
    },
  },
  plugins: [],
}
