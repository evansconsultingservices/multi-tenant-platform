const path = require('path');
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Add Module Federation plugin
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "shell",
          filename: "remoteEntry.js",
          remotes: {
            // Map remote apps - URLs come from environment variables in production
            helloWorld: `helloWorld@${process.env.REACT_APP_HELLO_WORLD_REMOTE_URL || 'http://localhost:3001'}/remoteEntry.js`,
            cloudinaryTool: `cloudinaryTool@${process.env.REACT_APP_CLOUDINARY_REMOTE_URL || 'http://localhost:3002'}/remoteEntry.js`,
            videoAssetManager: `videoAssetManager@${process.env.REACT_APP_VIDEO_ASSET_MANAGER_REMOTE_URL || 'http://localhost:3004'}/remoteEntry.js`,
          },
          exposes: {
            // Expose AuthContext so child tools can access authentication state and companyId
            "./AuthContext": "./src/contexts/AuthContext",
            // Expose BaseCompanyService for automatic company-scoped data queries
            "./BaseCompanyService": "./src/services/base.service",
            // Expose Firebase instance for child tools to use the same Firebase app
            "./Firebase": "./src/services/firebase",
          },
          shared: {
            ...deps,
            react: {
              singleton: true,
              requiredVersion: deps.react,
              eager: true,
            },
            "react-dom": {
              singleton: true,
              requiredVersion: deps["react-dom"],
              eager: true,
            },
            "react-router-dom": {
              singleton: true,
              requiredVersion: deps["react-router-dom"],
              eager: true,
            },
            // Share shadcn/radix dependencies
            "@radix-ui/react-slot": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-slot"],
              eager: true,
            },
            "@radix-ui/react-avatar": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-avatar"],
              eager: true,
            },
            "@radix-ui/react-dialog": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-dialog"],
              eager: true,
            },
            "@radix-ui/react-dropdown-menu": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-dropdown-menu"],
              eager: true,
            },
            "@radix-ui/react-label": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-label"],
              eager: true,
            },
            "@radix-ui/react-separator": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-separator"],
              eager: true,
            },
            "@radix-ui/react-tooltip": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-tooltip"],
              eager: true,
            },
            "@radix-ui/react-tabs": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-tabs"],
              eager: true,
            },
            "@radix-ui/react-switch": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-switch"],
              eager: true,
            },
            "@radix-ui/react-select": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-select"],
              eager: true,
            },
            "@radix-ui/react-collapsible": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-collapsible"],
              eager: true,
            },
            "lucide-react": {
              singleton: true,
              requiredVersion: deps["lucide-react"],
              eager: true,
            },
            "class-variance-authority": {
              singleton: true,
              requiredVersion: deps["class-variance-authority"],
              eager: true,
            },
            "clsx": {
              singleton: true,
              requiredVersion: deps["clsx"],
              eager: true,
            },
            "tailwind-merge": {
              singleton: true,
              requiredVersion: deps["tailwind-merge"],
              eager: true,
            },
            // Share UI components so child apps can use them
            "@/components/ui": {
              singleton: true,
              requiredVersion: "*",
            },
          },
        })
      );

      // Fix for Module Federation - use root path for dev server
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.output.publicPath = "/";
      } else {
        webpackConfig.output.publicPath = "auto";
      }

      // Handle async chunks properly
      webpackConfig.optimization.runtimeChunk = false;

      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    historyApiFallback: {
      // Handle client-side routing - serve index.html for non-static files
      disableDotRule: true,
      rewrites: [
        // Don't redirect static assets
        { from: /^\/static\//, to: function(context) {
          return context.parsedUrl.pathname;
        }},
        // Redirect all other routes to index.html
        { from: /./, to: '/index.html' }
      ]
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    proxy: {
      '/api/cloudinary': {
        target: 'http://localhost:3003',
        pathRewrite: { '^/api/cloudinary': '' },
        changeOrigin: true
      }
    }
  }
};