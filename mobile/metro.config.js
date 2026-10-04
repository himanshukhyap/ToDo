const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// This app lives inside the web project's folder. Never resolve anything from the
// web app's node_modules (React 18 / Vite deps) — only from mobile/node_modules.
const webNodeModules = path.resolve(__dirname, "..", "node_modules");
const escape = (s) => s.replace(/[/\\]/g, "[/\\\\]").replace(/[.*+?^${}()|]/g, "\\$&");

config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList || []),
  new RegExp(`^${escape(webNodeModules)}[/\\\\].*`),
];

module.exports = config;
