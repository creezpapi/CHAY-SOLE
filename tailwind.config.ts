import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { white:'#ffffff',black:'#000000','rv-gray':'#f2f2f2','rv-tab-inactive':'#666666' },
      fontFamily: { sans: ['Inter','Helvetica Neue','ui-sans-serif','system-ui','-apple-system','sans-serif'] },
      transitionDuration: { '250': '250ms' },
      maxWidth: { 'screen-md': '768px','screen-lg': '1024px' },
    },
  },
  plugins: [],
};
export default config;
