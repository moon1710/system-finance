// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shark: "#21252d",
        "outer-space": "#2b333c",
        "blue-violet": "#6762b3",
        "wild-sand": "#f7f7f7",
        empress: "#7c777a",
        "cornflower-blue": "#527ceb",
        cerulean: "#019fd2",
        "picton-blue": "#48b0f7",
        "bright-turquoise": "#10cfbd",
        gallery: "#f0f0f0",
      },
    },
  },
  plugins: [],
};
