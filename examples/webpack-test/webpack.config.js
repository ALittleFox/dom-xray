const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DOMSelectorPlugin } = require("@dom-selector/webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    port: 8081,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new DOMSelectorPlugin({
      title: "Webpack Test - DOM Selector",
    }),
  ],
};
