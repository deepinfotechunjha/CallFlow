/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'fluid-xs': 'clamp(0.25rem, 1vw, 0.5rem)',
        'fluid-sm': 'clamp(0.5rem, 2vw, 1rem)',
        'fluid-md': 'clamp(1rem, 3vw, 2rem)',
        'fluid-lg': 'clamp(1.5rem, 4vw, 3rem)',
        'fluid-xl': 'clamp(2rem, 5vw, 4rem)',
        'fluid-2xl': 'clamp(3rem, 6vw, 6rem)',
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 7vw, 3rem)',
      },
      width: {
        'fluid-quarter': 'clamp(20%, 25vw, 25%)',
        'fluid-third': 'clamp(30%, 33.333vw, 33.333%)',
        'fluid-half': 'clamp(45%, 50vw, 50%)',
        'fluid-two-thirds': 'clamp(60%, 66.666vw, 66.666%)',
        'fluid-three-quarters': 'clamp(70%, 75vw, 75%)',
        'fluid-full': 'clamp(90%, 100vw, 100%)',
      },
      maxWidth: {
        'fluid-xs': 'clamp(20rem, 90vw, 24rem)',
        'fluid-sm': 'clamp(24rem, 90vw, 28rem)',
        'fluid-md': 'clamp(28rem, 90vw, 32rem)',
        'fluid-lg': 'clamp(32rem, 90vw, 36rem)',
        'fluid-xl': 'clamp(36rem, 90vw, 42rem)',
        'fluid-2xl': 'clamp(42rem, 90vw, 48rem)',
        'fluid-container': 'clamp(20rem, 95vw, 80rem)',
      },
      gridTemplateColumns: {
        'fluid-auto': 'repeat(auto-fit, minmax(clamp(15rem, 30vw, 20rem), 1fr))',
        'fluid-cards': 'repeat(auto-fit, minmax(clamp(18rem, 35vw, 24rem), 1fr))',
        'fluid-stats': 'repeat(auto-fit, minmax(clamp(10rem, 20vw, 15rem), 1fr))',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.container-fluid': {
          width: '100%',
          maxWidth: 'clamp(20rem, 95vw, 80rem)',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)',
        },
        '.text-fluid': {
          fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
          lineHeight: 'clamp(1.25rem, 3.5vw, 1.75rem)',
        },
        '.heading-fluid': {
          fontSize: 'clamp(1.5rem, 5vw, 3rem)',
          lineHeight: 'clamp(2rem, 6vw, 3.5rem)',
        },
        '.gap-fluid': {
          gap: 'clamp(0.5rem, 2vw, 1.5rem)',
        },
        '.p-fluid': {
          padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        },
        '.px-fluid': {
          paddingLeft: 'clamp(0.75rem, 3vw, 1.5rem)',
          paddingRight: 'clamp(0.75rem, 3vw, 1.5rem)',
        },
        '.py-fluid': {
          paddingTop: 'clamp(0.75rem, 3vw, 1.5rem)',
          paddingBottom: 'clamp(0.75rem, 3vw, 1.5rem)',
        },
        '.m-fluid': {
          margin: 'clamp(0.5rem, 2vw, 1rem)',
        },
        '.mx-fluid': {
          marginLeft: 'clamp(0.5rem, 2vw, 1rem)',
          marginRight: 'clamp(0.5rem, 2vw, 1rem)',
        },
        '.my-fluid': {
          marginTop: 'clamp(0.5rem, 2vw, 1rem)',
          marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
        },
      })
    }
  ],
}