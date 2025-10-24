/// <reference types="react-scripts" />

// Webpack Module Federation globals
declare const __webpack_share_scopes__: {
  default: any;
};

declare global {
  interface Window {
    [key: string]: any;
  }
}
