/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    images: {
      allowFutureImage: true,
    },
  },
  images: {
    domains: ["www.osrsbox.com"],
  },
};
