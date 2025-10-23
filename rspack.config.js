const path = require("path");

const clientConfig = {
  //devtool: true, 
  name: "client",
  target: "web",
  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'], 
  },
  entry: {
    functions: "./src/client/main.ts",
  },
  output: {
    filename: "latens.client.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2020',
        },
        exclude: /node_modules/,
      },
    ],
  },
};

const swConfig = {
  //devtool: false, 
  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'], 
  },
  name: "sw",
  target: "webworker",
  entry: {
    sw: "./src/serviceWorker/main.ts",
  },
  output: {
    filename: "latens.sw.bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2020',
        },
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = [clientConfig, swConfig];