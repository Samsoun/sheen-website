/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hier können Sie benutzerdefinierte Farben hinzufügen
      },
      fontFamily: {
        // Hier können Sie benutzerdefinierte Schriftarten hinzufügen
      },
    },
  },
  plugins: [],
};
