const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Adds the Apple WeatherKit entitlement so the native module can call
 * WeatherService at runtime. The matching capability must also be enabled
 * on the App ID (com.jonathan-z.Sunny) in the Apple Developer portal.
 */
module.exports = function withWeatherKit(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults["com.apple.developer.weatherkit"] = true;
    return cfg;
  });
};
