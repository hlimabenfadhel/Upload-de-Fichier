// config-overrides.js

module.exports = function override(config, env) {
    config.resolve.fallback = {
      buffer: require.resolve('buffer/'),
      fs: false, // Pour éviter les erreurs liées à 'fs' dans le navigateur
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve("vm-browserify")
    };
    return config;
};