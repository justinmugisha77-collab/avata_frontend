/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '320px',
                'sm-mobile': { 'max': '374px' },
                'std-mobile': '375px',
                'lg-mobile': '480px',
                'sm-tablet': '576px',
                'std-tablet': '768px', // Equivalent to standard md
                'lg-tablet': '992px', // Equivalent to standard lg
                'sm-laptop': '1024px',
                'std-laptop': '1200px', // Equivalent to standard xl
                'lg-laptop': '1366px',
                'std-desktop': '1440px', // Equivalent to standard 2xl
                'lg-desktop': '1600px',
                'fhd': '1920px',
                '2k': '2560px',
                '4k': '3840px',
            },
        },
    },
    plugins: [],
}
