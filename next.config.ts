import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // esto habilita el plugin SWC para styled-components
    styledComponents: true,
  },
};

export default nextConfig;
