'use strict';

const bundleTypes = require('./bundles').bundleTypes;

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;
const RN_DEV = bundleTypes.RN_DEV;
const RN_PROD = bundleTypes.RN_PROD;

// If you need to replace a file with another file for a specific environment,
// add it to this list with the logic for choosing the right replacement.
const forks = Object.freeze({
  // Optimization: for UMDs, use object-assign polyfill that is already a part
  // of the React package instead of bundling it again.
  'object-assign': (bundleType, entry, dependencies) => {
    if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
      // It's only relevant for UMD bundles since that's where the duplication
      // happens. Other bundles just require('object-assign') anyway.
      return null;
    }
    if (dependencies.indexOf('react') === -1) {
      // We can only apply the optimizations to bundle that depend on React
      // because we read assign() from an object exposed on React internals.
      return null;
    }
    // We can use the fork!
    return 'shared/forks/object-assign.umd.js';
  },

  // We have a few forks for different environments.
  'shared/ReactFeatureFlags': (bundleType, entry) => {
    switch (entry) {
      case 'react-native-renderer':
        return 'shared/forks/ReactFeatureFlags.native.js';
      case 'react-cs-renderer':
        return 'shared/forks/ReactFeatureFlags.native-cs.js';
      default:
        switch (bundleType) {
          case FB_DEV:
          case FB_PROD:
            return 'shared/forks/ReactFeatureFlags.www.js';
        }
    }
    return null;
  },

  // This logic is forked on www to blacklist warnings.
  'shared/lowPriorityWarning': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        return 'shared/forks/lowPriorityWarning.www.js';
      default:
        return null;
    }
  },

  // In FB bundles, we preserve an inline require to ReactCurrentOwner.
  // See the explanation in FB version of ReactCurrentOwner in www:
  'react/src/ReactCurrentOwner': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        return 'react/src/forks/ReactCurrentOwner.www.js';
      default:
        return null;
    }
  },

  // Different wrapping/reporting for caught errors.
  'shared/invokeGuardedCallback': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        return 'shared/forks/invokeGuardedCallback.www.js';
      default:
        return null;
    }
  },

  // Different dialogs for caught errors.
  'react-reconciler/src/ReactFiberErrorDialog': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        // Use the www fork which shows an error dialog.
        return 'react-reconciler/src/forks/ReactFiberErrorDialog.www.js';
      case RN_DEV:
      case RN_PROD:
        switch (entry) {
          case 'react-native-renderer':
          case 'react-rt-renderer':
            // Use the RN fork which plays well with redbox.
            return 'react-reconciler/src/forks/ReactFiberErrorDialog.native.js';
          default:
            return null;
        }
      default:
        return null;
    }
  },

  // We wrap top-level listeners into guards on www.
  'react-dom/src/events/EventListener': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        // Use the www fork which is integrated with TimeSlice profiling.
        return 'react-dom/src/events/forks/EventListener-www.js';
      default:
        return null;
    }
  },
});

module.exports = forks;
