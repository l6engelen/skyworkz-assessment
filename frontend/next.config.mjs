/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export
  trailingSlash: true, // Ensures paths like /news/ are created for static hosting
};

export default nextConfig;
