import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { DomXrayPlugin } from "@dom-xray/webpack";

export default {
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(import.meta.dirname, "dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-typescript",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  devServer: {
    port: 8081,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new DomXrayPlugin({
      title: "Webpack Test - DOM Selector",
    }),
  ],
};
