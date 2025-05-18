module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      ["module:react-native-dotenv"],
      ["@babel/plugin-proposal-export-namespace-from"],
      ["react-native-reanimated/plugin"],
      ["@babel/plugin-transform-flow-strip-types"],
      ["@babel/plugin-transform-private-methods", { "loose": true }],
      ["@babel/plugin-transform-class-properties", { "loose": true }],
      ["@babel/plugin-transform-private-property-in-object", { "loose": true }]
    ],
  };
};
