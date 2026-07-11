import type { Config } from "@/types/config";

const config: Config = {
  server: {
    port: Number(process.env.PORT) || 8080,
    obfuscate: process.env.OBFUSCATE !== "false",
    compress: process.env.COMPRESS !== "false",
  },

  auth: {
    challenge: process.env.AUTH_CHALLENGE !== "false",
  },
};

export default config;
