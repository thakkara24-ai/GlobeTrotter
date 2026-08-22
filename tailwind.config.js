/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft Odoo-Inspired Palette:
        odoo: {
          primary: '#714B67',        // Refined Purple
          'primary-dark': '#5A3A52',
          'primary-soft': '#F4EEF3', // Soft Purple
          secondary: '#017E84',      // Refined Teal
          'secondary-dark': '#016368',
          'secondary-soft': '#EAF5F5', // Soft Teal
          bg: '#F7F7F6',             // Main Neutral Background
          surface: '#FFFFFF',        // Pure White Surface
          text: '#2F2930',           // Heading & Dark Text
          muted: '#6F6A70',          // Secondary Muted Text
          border: '#E5E1E4',         // Subtle Border
        },
        brand: {
          50: '#F4EEF3',
          100: '#EAE1E8',
          200: '#E5E1E4',
          300: '#D4CBD3',
          400: '#A4809C',
          500: '#8A5E80',
          600: '#714B67', // Primary Purple
          700: '#5A3A52',
          800: '#432B3D',
          900: '#2F2930',
        },
        tealbrand: {
          50: '#EAF5F5',
          100: '#D5ECEC',
          200: '#B0DCDE',
          300: '#75C2C6',
          400: '#34A2A8',
          500: '#017E84', // Secondary Teal
          600: '#016B70',
          700: '#015559',
          800: '#014043',
        },
        status: {
          success: '#4F8A68',
          'success-soft': '#EDF5F0',
          warning: '#B8893D',
          'warning-soft': '#FCF7ED',
          danger: '#B85C5C',
          'danger-soft': '#F9EFEF',
          info: '#5F7F9B',
          'info-soft': '#EFF4F8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(47, 41, 48, 0.03)',
        'xs': '0 1px 3px 0 rgba(47, 41, 48, 0.04)',
        'soft': '0 2px 8px -2px rgba(47, 41, 48, 0.05), 0 1px 3px -1px rgba(47, 41, 48, 0.03)',
        'card': '0 4px 16px -2px rgba(47, 41, 48, 0.06), 0 2px 6px -1px rgba(47, 41, 48, 0.03)',
        'elevated': '0 10px 25px -4px rgba(47, 41, 48, 0.08), 0 4px 10px -2px rgba(47, 41, 48, 0.04)',
        'dropdown': '0 12px 30px -4px rgba(47, 41, 48, 0.1), 0 4px 12px -2px rgba(47, 41, 48, 0.04)',
      },
      borderRadius: {
        'input': '0.625rem',  // 10px
        'card': '0.875rem',   // 14px
        'panel': '1.125rem',  // 18px
      },
    },
  },
  plugins: [],
}
