/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs', // Include all EJS files
    './views/*.ejs',
    './public/**/*.{html,js,ejs}'
  ]
  , // all .ejs files
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  
  
  },
}
