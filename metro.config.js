const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@": path.resolve(__dirname, "src"),
  "constants": path.resolve(__dirname, "src/constants"),
  "services": path.resolve(__dirname, "src/services"),
  "store": path.resolve(__dirname, "src/store"),
  "hooks": path.resolve(__dirname, "src/hooks"),
  "components": path.resolve(__dirname, "src/components"),
  "utils": path.resolve(__dirname, "src/utils"),
  "types": path.resolve(__dirname, "src/types"),
  "assets": path.resolve(__dirname, "src/assets"),
};

module.exports = config;
