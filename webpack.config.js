const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/taskpane/index.tsx',
  output: {
    filename: 'taskpane.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ENTRA_CLIENT_ID': JSON.stringify(process.env.ENTRA_CLIENT_ID || ''),
      'process.env.ENTRA_TENANT_ID': JSON.stringify(process.env.ENTRA_TENANT_ID || ''),
    }),
    new HtmlWebpackPlugin({
      template: './src/taskpane/taskpane.html',
      filename: 'taskpane.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/taskpane/taskpane.html',
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/taskpane/dialog.html',
      filename: 'dialog.html',
      chunks: [],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
        {
          from: 'staticwebapp.config.json',
          to: 'staticwebapp.config.json',
        },
      ],
    }),
  ],
  devServer: {
    server: 'https',
    port: 3000,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  devtool: 'source-map',
};
