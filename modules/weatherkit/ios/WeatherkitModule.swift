import ExpoModulesCore
import CoreLocation
import WeatherKit

public class WeatherkitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Weatherkit")

    // Returns the current UV index plus an hourly UV forecast for the given
    // coordinates. The JS layer derives all display values (category, SPF,
    // burn time, peak window, bars) from this raw data.
    AsyncFunction("getUV") { (latitude: Double, longitude: Double) async throws -> [String: Any] in
      guard #available(iOS 16.0, *) else {
        throw Exception(
          name: "UnsupportedOS",
          description: "WeatherKit requires iOS 16 or newer."
        )
      }

      let location = CLLocation(latitude: latitude, longitude: longitude)
      let weather = try await WeatherService.shared.weather(for: location)

      let current = weather.currentWeather.uvIndex.value

      let iso = ISO8601DateFormatter()
      // Next 24 hours of UV so the JS layer can build the daytime curve.
      let hourly: [[String: Any]] = weather.hourlyForecast.forecast.prefix(24).map { hour in
        [
          "time": iso.string(from: hour.date),
          "uvIndex": hour.uvIndex.value,
        ]
      }

      let dailyMax = weather.dailyForecast.forecast.first?.uvIndex.value ?? current

      // Next 7 days of peak UV so the JS layer can build the weekly outlook.
      let daily: [[String: Any]] = weather.dailyForecast.forecast.prefix(7).map { day in
        [
          "date": iso.string(from: day.date),
          "uvIndex": day.uvIndex.value,
        ]
      }

      return [
        "current": current,
        "hourly": hourly,
        "dailyMax": dailyMax,
        "daily": daily,
      ]
    }
  }
}
