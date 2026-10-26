/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Creepster"', "cursive"],
        sans: ['"Nunito"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        bubble: {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, 0.5rem) scale(0.6)",
          },
          "15%": {
            opacity: "1",
            transform: "translate(-50%, -0.5rem) scale(1.15)",
          },
          "75%": {
            opacity: "1",
            transform: "translate(-50%, -1.5rem) scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -3rem) scale(1)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(1rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        banner: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        pop: "pop 0.5s ease-out",
        bubble: "bubble 2.6s ease-out forwards",
        float: "float 4s ease-in-out infinite",
        "slide-up": "slide-up 0.25s ease-out",
        banner: "banner 0.6s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
};
