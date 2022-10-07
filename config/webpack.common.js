const paths = require('./paths');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
//const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
//const { webpack } = require('webpack');

module.exports = {
  entry: [paths.src + '/index.tsx'],
  output: {
    path: paths.build,
    filename: '[name].bundle.js',
    publicPath: '/',
  },

  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),

    // Copies files from target to destination folder

    /*
    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.src + '/assets',
          to: '',
          globOptions: {
            ignore: ['*.DS_Store'],
          },
        },
      ],
    }),    
    */

    // Generates an HTML file from a template
    // Generates deprecation warning: https://github.com/jantimon/html-webpack-plugin/issues/1501
    new HtmlWebpackPlugin({
      title: 'Project Title',
      template: paths.public + '/index.html', // template file
      //favicon: paths.src + '/assets/icons/favicon.png',
      favicon: paths.public + '/favicon.svg',
      // favicon: paths.src + '/assets/images/cms/favicon.svg',
      filename: 'index.html', // output file
    }),
  ],
  // optimization: {
  //   minimize: true,
  // },
  resolve: {
    alias: {
      '@': paths.src,
      comp: paths.comp,
      types: paths.src + '/types',
      imgs: paths.src + '/assets/images',
      cont: paths.src + '/contexts',
      sets: paths.src + '/settings',
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },

  module: {
    rules: [
      // JavaScript: Use Babel to transpile JavaScript files
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { modules: 'commonjs' }],
                '@babel/preset-typescript',
                '@babel/preset-react',
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-transform-runtime',
              ],
            },
          },
        ],
      },
      // Fonts and SVGs: Inline files
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              fallback: 'file-loader',
              name: 'fonts/[name].[ext]?[hash]',
            },
          },
        ],
      },
      // Styles: Inject CSS into the head with source maps
      {
        test: /\.(css|scss|sass)$/,
        use: [
          //MiniCssExtractPlugin.loader,
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader', // postcss loader needed for tailwindcss
            options: {
              postcssOptions: {
                ident: 'postcss',
                plugins: [tailwindcss, autoprefixer],
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },

      /*
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        loader: 'file-loader',
        options: {
          outputPath: 'images/',
          name: '[name].[ext]',
        }
      }
      */

      {
        test: /\.svg$/,
        use: [
          '@svgr/webpack',
          {
            loader: 'file-loader',
            options: {
              //name: 'images/[name].[ext]?[hash]',
              name: 'images/[name].[ext]',
            },
          },
        ],
      },

      // Images: Copy image files to build folder
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        //type: 'asset/resource'
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/',
        },
      },
    ],
  },
};
