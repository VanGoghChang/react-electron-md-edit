const path = require('path')

module.export = {
    target: "electron-main",
    entry: "./main.js",
    output: {
        path: path.resolve(__dirname, "./build"),
        filename: "main.js",
        resolve: {
            extensions: ['', '.js', '.jsx']
        },
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    loader: 'babel',
                    exclude: /node_modules/,
                    query: {
                        cacheDirectory: true,
                        presets: ['react', 'es2015']
                    }
                }
            ]
        }
    },
    node: {
        __dirname: false
    }
}