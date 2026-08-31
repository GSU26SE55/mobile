const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'version "4.1.2" // withWindowsCmakeVersion';

// ponytail: AGP's default CMake (3.22.1, bundled with the NDK) ships ninja 1.10.2,
// which hard-rejects any object path over 260 chars. On Windows that limit gets hit
// routinely once autolinked native modules (react-native-keyboard-controller,
// reanimated, ...) nest deep enough under node_modules — CMakeFiles mirrors the full
// absolute source path into the object dir. CMake 4.1.2 (installed via SDK Manager)
// bundles ninja 1.12+, which supports long paths.
//
// Windows-only: macOS/Linux have no such path ceiling, and pinning 4.1.2 there just
// breaks the build on any machine whose SDK only carries the NDK-bundled 3.22.1.
module.exports = function withWindowsCmakeVersion(config) {
  if (process.platform !== 'win32') return config;
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents = mod.modResults.contents.replace(
      /^android \{/m,
      `android {\n    externalNativeBuild {\n        cmake {\n            ${MARKER}\n        }\n    }\n`,
    );
    return mod;
  });
};
