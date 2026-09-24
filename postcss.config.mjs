/**
 * PostCSS pipeline for Tailwind CSS v4.
 *
 * Tailwind v4 ships a single PostCSS plugin (`@tailwindcss/postcss`) that
 * replaces the old `tailwindcss` + `autoprefixer` pair: vendor prefixing is
 * now handled by Lightning CSS inside the plugin, and configuration lives in
 * CSS (`@theme`) instead of `tailwind.config.js`.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
