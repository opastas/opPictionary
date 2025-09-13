const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure no SVG processing
config.resolver.assetExts.push('svg');
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'svg');

module.exports = config;
