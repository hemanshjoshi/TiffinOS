module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        unstable_transformImportMeta: true 
      }]
    ],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'babel-plugin-transform-inline-environment-variables',
        {
          "include": [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY"
          ]
        }
      ]
    ],
  };
};
