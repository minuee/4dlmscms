const paths = require('./paths');
const Dotenv = require('dotenv-webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  output: {
    path: paths.build,
    publicPath: '/',
    filename: 'js/[name].[contenthash].bundle.js',
  },
  plugins: [
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static', // 분석결과를 파일로 저장
    //   reportFilename: 'size_dev.html', // 분설결과 파일을 저장할 경로와 파일명 지정
    //   defaultSizes: 'parsed',
    //   openAnalyzer: true, // 웹팩 빌드 후 보고서파일을 자동으로 열지 여부
    //   generateStatsFile: true, // 웹팩 stats.json 파일 자동생성
    //   statsFilename: 'stats_dev.json', // stats.json 파일명 rename
    // }),
    new Dotenv({
      path: './.env.development.local_bell',
    }),
    // Extracts CSS into separate files
    // Note: style-loader is for development, MiniCssExtractPlugin is for production
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
      chunkFilename: '[id].css',
    }),
  ],
  module: {
    rules: [],
  },
  optimization: {
    minimize: true,
    minimizer: [new OptimizeCssAssetsPlugin(), new TerserPlugin()],
    // Once your build outputs multiple chunks, this option will ensure they share the webpack runtime
    // instead of having their own. This also helps with long-term caching, since the chunks will only
    // change when actual code changes, not the webpack runtime.
    runtimeChunk: {
      name: 'runtime',
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});
