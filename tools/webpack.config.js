import path from 'path';
import webpack from 'webpack';
import extend from 'extend';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import fs from 'fs';
let mainConfig = { cdn: '' };
const DEBUG = !process.argv.includes('--release');
const VERBOSE = process.argv.includes('--verbose');
const isAnalyze =
  process.argv.includes('--analyze') || process.argv.includes('--analyse');
const AUTOPREFIXER_BROWSERS = [
  'Android 2.3',
  'Android >= 4',
  'Chrome >= 35',
  'Firefox >= 31',
  'Explorer >= 9',
  'iOS >= 7',
  'Opera >= 12',
  'Safari >= 7.1',
];
const GLOBALS = {
  'process.env.NODE_ENV': DEBUG ? '"development"' : '"production"',
  __DEV__: DEBUG,
};

//
// Common configuration chunk to be used for both
// client-side (client.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------
const defaultPostcss = (bundler) => {
  return [
    // Transfer @import rule by inlining content, e.g. @import 'normalize.css'
    // https://github.com/postcss/postcss-import
    require('postcss-import')(),
    // W3C variables, e.g. :root { --color: red; } div { background: var(--color); }
    // https://github.com/postcss/postcss-custom-properties
    require('postcss-custom-properties')(),
    // W3C CSS Custom Media Queries, e.g. @custom-media --small-viewport (max-width: 30em);
    // https://github.com/postcss/postcss-custom-media
    require('postcss-custom-media')(),
    // CSS4 Media Queries, e.g. @media screen and (width >= 500px) and (width <= 1200px) { }
    // https://github.com/postcss/postcss-media-minmax
    require('postcss-media-minmax')(),
    // W3C CSS Custom Selectors, e.g. @custom-selector :--heading h1, h2, h3, h4, h5, h6;
    // https://github.com/postcss/postcss-custom-selectors
    require('postcss-custom-selectors')(),
    // W3C calc() function, e.g. div { height: calc(100px - 2em); }
    // https://github.com/postcss/postcss-calc
    require('postcss-calc')(),
    // Allows you to nest one style rule inside another
    // https://github.com/jonathantneal/postcss-nesting
    require('postcss-nesting')(),
    // W3C color() function, e.g. div { background: color(red alpha(90%)); }
    // https://github.com/postcss/postcss-color-function
    require('postcss-color-function')(),
    // Convert CSS shorthand filters to SVG equivalent, e.g. .blur { filter: blur(4px); }
    // https://github.com/iamvdo/pleeease-filters
    require('pleeease-filters')(),
    // Generate pixel fallback for "rem" units, e.g. div { margin: 2.5rem 2px 3em 100%; }
    // https://github.com/robwierzbowski/node-pixrem
    require('pixrem')(),
    // W3C CSS Level4 :matches() pseudo class, e.g. p:matches(:first-child, .special) { }
    // https://github.com/postcss/postcss-selector-matches
    require('postcss-selector-matches')(),
    // Transforms :not() W3C CSS Level 4 pseudo class to :not() CSS Level 3 selectors
    // https://github.com/postcss/postcss-selector-not
    require('postcss-selector-not')(),
    // Add vendor prefixes to CSS rules using values from caniuse.com
    // https://github.com/postcss/autoprefixer
    require('autoprefixer')({ browsers: AUTOPREFIXER_BROWSERS }),
  ];
};
const sassPostcss = (bundler) => {
  return [
    require('autoprefixer')({ browsers: AUTOPREFIXER_BROWSERS }),
  ]
};
const config = {
  context: path.resolve(__dirname, '../src'),
  mode: DEBUG ? 'development' : 'production',
  output: {
    path: path.resolve(__dirname, '../dist/static/assets'),
    publicPath: mainConfig.cdn + '/assets/',
    sourcePrefix: '  ',
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: DEBUG,
              babelrc: false,
              presets: [
                'react',
                'es2015',
                'stage-0',
              ],
              plugins: [
                'transform-runtime',
                [
                  "antd",
                  {
                    "style": "true"
                  }
                ],
                ...DEBUG ? [] : [
                  'transform-react-remove-prop-types',
    
                ],
              ],
            },
          }
        ],
        include: [
          path.resolve(__dirname, '../src'),
        ],
      
      },
      {
        // third pard ui componnet has compiled, so dynamic className is not fit
        // eg: antd 
        test: /\.css$/,
        include: [
          path.join(__dirname, "../src/thirdpart"),
          path.join(__dirname, "../node_modules"),
        ],
        use: [
          'isomorphic-style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: loader => defaultPostcss(loader)
            }
          },
        ],
      },
      {
        // add dynamic className for our project
        test(filePath) {
          return /\.css$/.test(filePath) && filePath.startsWith(path.join(__dirname, "../src"))
            && !filePath.startsWith(path.join(__dirname, "../src/thirdpart"));
        },
        use: [
          'isomorphic-style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: DEBUG,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: true,
              localIdentName: DEBUG ? '[name]_[local]_[hash:base64:3]' : '[hash:base64:6]',
              // CSS Nano http://cssnano.co/options/
              minimize: !DEBUG,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: loader => defaultPostcss(loader)
            }
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'isomorphic-style-loader',
          //`css-loader?${JSON.stringify({ sourceMap: DEBUG, minimize: !DEBUG })}`,
          {
            loader: 'css-loader',
            options: {
              sourceMap: DEBUG,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: true,
              localIdentName: DEBUG ? '[name]_[local]_[hash:base64:3]' : '[hash:base64:6]',
              // CSS Nano http://cssnano.co/options/
              minimize: !DEBUG,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: loader => sassPostcss(loader)
            }
          },
          'sass-loader',
        ],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: '[hash:6].[ext]',
            },
          }, {
            loader: 'image-webpack-loader',
            options: {
              progressive: true,
              optimizationLevel: 7,
              interlaced: false,
              pngquant: {
                quality: '65-90',
                speed: 4,
              }
            }
          },
        ],
      },
      {
        test: /\.(woff|woff2)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: '[hash:6].[ext]',
          },
        }]
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: DEBUG ? '[path][name].[ext]?[hash]' : '[hash].[ext]',
            },
          }
        ],
      },
      // Exclude dev modules from production build
      ...(DEBUG
        ? []
        : [
            {
              test: path.resolve(__dirname, '../node_modules/react-deep-force-update/lib/index.js'),
              loader: 'null-loader',
            },
          ]),
    ],
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx', '.json'],
  },

  cache: DEBUG,

  stats: {
    assets: true,
    colors: true,
    reasons: DEBUG,
    hash: VERBOSE,
    version: VERBOSE,
    timings: true,
    chunks: VERBOSE,
    chunkModules: VERBOSE,
    cached: VERBOSE,
    cachedAssets: VERBOSE,
  },

  
};

//
// Configuration for the client-side bundle (client.js)
// -----------------------------------------------------------------------------

const clientConfig = extend(true, {}, config, {
  entry: {
    client: ['./client.js'],
  },
  name: 'client',
  output: {
    filename: DEBUG ? '[name].js?[chunkhash]' : '[name].[chunkhash].js',
    chunkFilename: DEBUG ? '[name].[id].js?[chunkhash]' : '[name].[id].[chunkhash].js',
  },

  target: 'web',
  optimization: {
    minimize: !DEBUG,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
        },
      },
    },
  },
  plugins: [

    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({ ...GLOBALS, 'process.env.BROWSER': true }),

    // Emit a file with assets paths
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve(__dirname, '../dist'),
      filename: 'assets.js',
      processOutput: x => `module.exports = ${JSON.stringify(x)};`,
    }),
    // Assign the module and chunk ids by occurrence count
    // Consistent ordering of modules required if using any hashing ([hash] or [chunkhash])
    // https://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin
    // new webpack.optimize.OccurenceOrderPlugin(true),

    ...DEBUG ? [] : [

      // Search for equal or similar files and deduplicate them in the output
      // https://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
      // new webpack.optimize.DedupePlugin(),

      // Minimize all JavaScript output of chunks
      // https://github.com/mishoo/UglifyJS2#compressor-options

      // A plugin for a more aggressive chunk merging strategy
      // https://webpack.github.io/docs/list-of-plugins.html#aggressivemergingplugin
      new webpack.optimize.AggressiveMergingPlugin(),
      ...isAnalyze? [new BundleAnalyzerPlugin()]: [],
    ],
  ],

  // Choose a developer tool to enhance debugging
  // http://webpack.github.io/docs/configuration.html#devtool
  devtool: DEBUG ? 'cheap-module-eval-source-map' : false,
});

//
// Configuration for the server-side bundle (server.js)
// -----------------------------------------------------------------------------

const serverConfig = extend(true, {}, config, {
  entry: './server.js',
  name: 'server',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'server.js',
    chunkFilename: 'chunks/[name].js',
    libraryTarget: 'commonjs2',
  },

  target: 'node',

  externals: [/^[a-z\-0-9]+$/, /^\.\/assets$/],

  plugins: [

    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({ ...GLOBALS, 'process.env.BROWSER': false }),

    // Adds a banner to the top of each generated chunk
    // https://webpack.github.io/docs/list-of-plugins.html#bannerplugin
    new webpack.BannerPlugin({ banner: 'require("source-map-support").install();', raw: true, entryOnly: false }),
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],

  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
  },

  devtool: 'source-map',
});

export default [clientConfig, serverConfig];
