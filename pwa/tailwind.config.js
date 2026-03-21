/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5B',
          dark: '#E55A2B'
        },
        accent: {
          DEFAULT: '#FFD700',
          light: '#FFE44D'
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399'
        },
        background: {
          DEFAULT: '#FFF8F5',
          secondary: '#F5F5F5'
        }
      }
    }
  },
  plugins: []
}
