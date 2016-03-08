var path = require('path');

var webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyPlugin        = require('copy-webpack-plugin');
var AssetsPlugin      = require('assets-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

// use the `OPTIMIZE` env VAR to switch from dev to production build
var optimize = process.env.OPTIMIZE === 'true';

/**
 * Loaders used by webpack
 *
 * - CSS and images files from `vendor` are excluded
 * - stylesheets are optimized via cssnano, minus svgo and autoprefixer that are
 * customized via PostCSS
 * - images are cache-busted in production build
 */
var cssOptions = optimize? 'css?-svgo&-autoprefixer&-mergeRules!postcss':'css';
var loaders = [
    {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
            presets: ['es2015']
        }
    },
    {
        test: /\.jst$/,
        loader: 'underscore'
    },
    {
        test: /\.styl$/,
        loader: ExtractTextPlugin.extract('style', cssOptions + '!stylus')
    },
    {
        test: /\.svg$/,
        include: /icons/,
        loader: 'svg-sprite'
    }
];

/**
 * Configure Webpack's plugins to tweaks outputs:
 *
 * all builds:
 * - ExtractTextPlugin: output CSS to file instead of inlining it
 *
 * prod build:
 * - AssetsPlugin: paths to cache-busted's assets to read them from server
 * - DedupePlugin
 * - OccurenceOrderPlugin
 * - UglifyJsPlugin
 * - DefinePlugin: disable webpack env dev vars
 *
 * dev build:
 * - BrowserSyncPlugin: make hot reload via browsersync exposed at
 *   http://localhost:3000, proxified to the server app port
 */
var plugins = [
    new ExtractTextPlugin(optimize? 'app.[hash].css' : 'app.css'),
    new CopyPlugin([
        {
            from: 'app/assets/index.html'
        },
        {
            from: 'app/assets/fonts',
            to: 'fonts'
        }
    ]),
    new webpack.ProvidePlugin({
        $: "jquery",
        _: "underscore"
    })
];

if (optimize) {
    plugins = plugins.concat([
        new AssetsPlugin({
            filename: '../build/webpack-assets.json'
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: true,
            compress: {
                warnings: false
            },
        }),
        new webpack.DefinePlugin({
            __SERVER__:      !optimize,
            __DEVELOPMENT__: !optimize,
            __DEVTOOLS__:    !optimize
        })
    ]);
} else {
    plugins = plugins.concat([
        new BrowserSyncPlugin({
            proxy: 'http://localhost:' + (process.env.PORT || 9104) + '/',
            open: false
        })
    ]);
}

/**
 * PostCSS Config
 *
 * - autoprefixer to add vendor prefixes for last 2 versions
 * - mqpacker to bring together all MQ rule's set
 */
var postcss = [
    require('autoprefixer')(['last 2 versions']),
    require('css-mqpacker')
];

/**
 * Webpack config
 *
 * - output to `public` dir
 * - cache-bust assets when build for production
 */
module.exports = {
    entry: './app/initialize',
    output: {
        path: path.join(optimize? '../build/client' : '', 'public'),
        filename: optimize? 'app.[hash].js' : 'app.js',
    },
    resolve: {
        extensions: ['', '.js', '.sass', '.jst']
    },
    debug: !optimize,
    devtool: 'source-map',
    module: {
        loaders: loaders
    },
    plugins: plugins,
    postcss: postcss
};
