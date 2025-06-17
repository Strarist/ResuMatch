/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neomorphic': '20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff',
        'neomorphic-dark': '20px 20px 60px #1a1a1a, -20px -20px 60px #2a2a2a',
        'neomorphic-sm': '5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff',
        'neomorphic-sm-dark': '5px 5px 15px #1a1a1a, -5px -5px 15px #2a2a2a',
        'neo-sm': '4px 4px 8px #d1d5db, -4px -4px 8px #ffffff',
        'neo-md': '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
        'neo-lg': '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
        'neo-inset-sm': 'inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff',
        'neo-inset-md': 'inset 6px 6px 12px #d1d5db, inset -6px -6px 12px #ffffff',
        'neo-inset-lg': 'inset 8px 8px 16px #d1d5db, inset -8px -8px 16px #ffffff',
        'neo-dark-sm': '4px 4px 8px #1f2937, -4px -4px 8px #374151',
        'neo-dark-md': '6px 6px 12px #1f2937, -6px -6px 12px #374151',
        'neo-dark-lg': '8px 8px 16px #1f2937, -8px -8px 16px #374151',
        'neo-dark-inset-sm': 'inset 4px 4px 8px #1f2937, inset -4px -4px 8px #374151',
        'neo-dark-inset-md': 'inset 6px 6px 12px #1f2937, inset -6px -6px 12px #374151',
        'neo-dark-inset-lg': 'inset 8px 8px 16px #1f2937, inset -8px -8px 16px #374151',
        'error-sm': '4px 4px 8px #fecaca, -4px -4px 8px #ffffff',
        'error-dark-sm': '4px 4px 8px #991b1b, -4px -4px 8px #374151',
      },
      scrollbar: {
        thin: '8px',
        DEFAULT: '12px',
        thick: '16px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
} 