/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',       // gray-50
        foreground: 'var(--color-foreground)',        // gray-900
        border: 'var(--color-border)',                // black/8
        input: 'var(--color-input)',                  // white
        ring: 'var(--color-ring)',                    // blue-500
        card: {
          DEFAULT: 'var(--color-card)',               // white
          foreground: 'var(--color-card-foreground)', // gray-900
        },
        popover: {
          DEFAULT: 'var(--color-popover)',            // white
          foreground: 'var(--color-popover-foreground)', // gray-900
        },
        primary: {
          DEFAULT: 'var(--color-primary)',            // gray-900
          foreground: 'var(--color-primary-foreground)', // white
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',          // gray-700
          foreground: 'var(--color-secondary-foreground)', // white
        },
        accent: {
          DEFAULT: 'var(--color-accent)',             // blue-500
          foreground: 'var(--color-accent-foreground)', // white
        },
        muted: {
          DEFAULT: 'var(--color-muted)',              // zinc-100
          foreground: 'var(--color-muted-foreground)', // gray-500
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',        // red-500
          foreground: 'var(--color-destructive-foreground)', // white
        },
        success: {
          DEFAULT: 'var(--color-success)',            // emerald-500
          foreground: 'var(--color-success-foreground)', // white
        },
        warning: {
          DEFAULT: 'var(--color-warning)',            // amber-500
          foreground: 'var(--color-warning-foreground)', // gray-900
        },
        error: {
          DEFAULT: 'var(--color-error)',              // red-500
          foreground: 'var(--color-error-foreground)', // white
        },
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
        caption: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-2': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
        'display-3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'display-4': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'display-5': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 3px rgba(0,0,0,0.08)',
        'elevation-2': '0 2px 8px rgba(0,0,0,0.06)',
        'elevation-3': '0 6px 16px rgba(0,0,0,0.10)',
        'elevation-4': '0 12px 24px rgba(0,0,0,0.12)',
        'elevation-5': '0 20px 40px rgba(0,0,0,0.12)',
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.12)',
        'modal': '0 20px 40px rgba(0,0,0,0.12)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      zIndex: {
        'nav': '100',
        'dropdown': '50',
        'modal': '200',
        'toast': '300',
        'overlay': '150',
      },
    },
  },
  plugins: [],
};