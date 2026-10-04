const { withAppBuildGradle } = require("expo/config-plugins");

// Signs release builds with mobile/credentials/notetask-release.jks
// (credentials/keystore.properties). Falls back to the debug key if the
// credentials folder is missing, so a fresh clone can still build.
const SIGNING = `
    def ntKeystorePropsFile = rootProject.file("../credentials/keystore.properties")
    def ntKeystoreProps = new Properties()
    if (ntKeystorePropsFile.exists()) {
        ntKeystorePropsFile.withInputStream { ntKeystoreProps.load(it) }
    }
`;

const RELEASE_CONFIG = `
        release {
            if (ntKeystorePropsFile.exists()) {
                storeFile rootProject.file("../credentials/" + ntKeystoreProps["storeFile"])
                storePassword ntKeystoreProps["storePassword"]
                keyAlias ntKeystoreProps["keyAlias"]
                keyPassword ntKeystoreProps["keyPassword"]
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes("ntKeystorePropsFile")) return cfg;

    // 1. Load keystore.properties at the top of the android { } block
    src = src.replace(/android\s*\{/, (m) => `${m}${SIGNING}`);

    // 2. Add a "release" signing config next to "debug"
    src = src.replace(/signingConfigs\s*\{/, (m) => `${m}${RELEASE_CONFIG}`);

    // 3. Use it for the release build type
    src = src.replace(
      /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig ntKeystorePropsFile.exists() ? signingConfigs.release : signingConfigs.debug"
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
