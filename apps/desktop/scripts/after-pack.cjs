// electron-builder afterPack hook.
//
// We don't have an Apple Developer ID, so the macOS build can't be notarized.
// An *unsigned* arm64 app won't launch at all ("app is damaged"), so we at
// least **ad-hoc sign** it here. Combined with stripping the download
// quarantine (`xattr -cr`, see README), this lets the app open.
//
// No-op on Windows/Linux.
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = join(context.appOutDir, appName);
  try {
    execFileSync('codesign', ['--deep', '--force', '--sign', '-', appPath], { stdio: 'inherit' });
    console.log(`[after-pack] ad-hoc signed ${appName}`);
  } catch (e) {
    console.warn(`[after-pack] ad-hoc signing failed (continuing): ${e.message}`);
  }
};
