/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Asegúrate que la ruta a tu componente Sidebar esté incluida aquí
  ],
  theme: {
    extend: {
      // Los colores deben estar DENTRO de 'extend'
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
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
