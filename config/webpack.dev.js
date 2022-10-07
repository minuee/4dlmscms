const paths = require('./paths');
const Dotenv = require('dotenv-webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    contentBase: paths.build,
    // open: true,
    compress: true,
    hot: true,
    host: 'localhost',
    port: 5000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },    
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [require.resolve('react-refresh/babel')].filter(Boolean),
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: './.env.development',
    }),
    new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
});
