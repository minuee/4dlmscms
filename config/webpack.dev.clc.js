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
    // https: true,
    // https: {
    //   key: fs.readFileSync('/etc/letsencrypt/live/local-cms-ims.4dreplay.io/privkey.pem'),
    //   cert: fs.readFileSync('/etc/letsencrypt/live/local-cms-ims.4dreplay.io/cert.pem'),
    //   ca: fs.readFileSync('/etc/letsencrypt/live/local-cms-ims.4dreplay.io/chain.pem'),
    // },
    compress: true,
    hot: true,
    host: '0.0.0.0',
    disableHostCheck: true,
    //port: 443, // https (http: 3000)
    port: 5000, // https (http: 3000)
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
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
      path: './.env.clc',      
    }),
    new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
});
