/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#7A0808',
          light: '#FFF0F0',
          dark: '#5a0606',
        },
        dark: '#2B3235',
      }
    }
  },
  plugins: []
}
