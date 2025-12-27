/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ana Renkler - Temiz ve Modern
        primary: {
          50: '#f8fafc',   // Çok açık gri
          100: '#f1f5f9',  // Açık gri
          200: '#e2e8f0',  // Gri
          300: '#cbd5e1',  // Orta gri
          900: '#0f172a'   // Çok koyu gri
        },
        // Bilimsel Renkler - Soft Mavi ve Yeşil
        scientific: {
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',  // Eksik olan 200 değeri
            300: '#93c5fd',
            400: '#60a5fa',  // Eksik olan 400 değeri
            500: '#3b82f6',  // Ana bilimsel mavi
            700: '#1d4ed8',
            800: '#1e40af'   // Eksik olan 800 değeri
          },
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            300: '#86efac',
            500: '#10b981',  // Ana bilimsel yeşil
            700: '#047857'
          }
        },
        // Vurgulayıcı Renkler - Pastel ve Neon
        accent: {
          gold: {
            50: '#fffbeb',
            200: '#fef3c7',
            400: '#fbbf24',  // Ana altın
            500: '#f59e0b'
          },
          pink: {
            50: '#fdf2f8',
            200: '#fbcfe8',
            300: '#f9a8d4',  // Pastel pembe
            400: '#f472b6'
          },
          lavender: {
            50: '#faf5ff',
            200: '#e9d5ff',
            300: '#c4b5fd',  // Lavanta
            400: '#a78bfa'
          }
        },
        // Neon Efektler - Soft Versiyonları
        neon: {
          yellow: {
            100: '#fefce8',
            200: '#fef08a',  // Soft neon sarı
            300: '#facc15'
          },
          orange: {
            100: '#fff7ed',
            200: '#fed7aa',  // Soft neon turuncu
            300: '#fb923c'
          }
        },
        // Glassmorphism için özel renkler
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.15)',
          medium: 'rgba(255, 255, 255, 0.25)',
          strong: 'rgba(255, 255, 255, 0.4)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'monospace']
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'molecule-rotate': 'moleculeRotate 20s linear infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)' 
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.5)' 
          },
        },
        moleculeRotate: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '100%': { transform: 'rotateX(360deg) rotateY(360deg)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.4)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4)'
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        skeletonPulse: {
          '0%': { opacity: '0.6' },
          '100%': { opacity: '1' },
        },
      },
      // 3D Kartlar için özel değerler
      perspective: {
        '1000': '1000px',
        '1500': '1500px',
        '2000': '2000px',
      },
      // Gradientler
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(45deg, #fbbf24, #f472b6, #a78bfa)',
        'science-gradient': 'linear-gradient(135deg, #3b82f6, #10b981)',
      }
    },
  },
  plugins: [],
}