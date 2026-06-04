/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Production source maps — нужны Lighthouse'у для определения какой именно
  // компонент бросает console error (без map'ов PSI снижает Best Practices
  // score за «missing source maps for large first-party JavaScript»). Размер
  // браузерных бандлов чуть растёт, но .map грузятся только при открытии
  // DevTools — на runtime не влияют.
  productionBrowserSourceMaps: true,
};

export default nextConfig;
