import pxToRem from "./postcss-px-to-rem.mjs"

const config = {
  plugins: [["@tailwindcss/postcss", {}], pxToRem],
};

export default config;
