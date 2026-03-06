/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cobalt': '#0A1628',
                'clinical': '#F8FAFC',
                'electric': '#00D4FF',
                'premium': '#FFB800',
                'japandi-beige': '#E2D7C6',
                'japandi-sand': '#F5F2ED',
                'japandi-taupe': '#9B8476',
                'japandi-charcoal': '#36393E',
                'japandi-wood': '#C19A6B'
            },
            fontFamily: {
                syne: ['Syne', 'sans-serif'],
                sans: ['DM Sans', 'sans-serif'],
            },
            animation: {
                'scan': 'scan 2s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' }
                }
            }
        },
    },
    plugins: [],
}
