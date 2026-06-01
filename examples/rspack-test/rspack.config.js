const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DOMSelectorRspackPlugin } = require("@dom-selector/rspack");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    port: 8082,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new DOMSelectorRspackPlugin({
      title: "Rspack Test - DOM Selector",
    }),
  ],
};
