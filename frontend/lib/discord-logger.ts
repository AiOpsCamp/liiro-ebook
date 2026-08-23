import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Application from "expo-application";

// TODO: IN PRODUCTION PLEASE MAKE THIS WEBHOOK FEATURES IS REMOVED OR HIDDEN
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1452999451731038258/3YxyWwbNmY8dgYoXGYclAS5KTt2AMvFJT9Kc7yjqKBuxcFwrA8dwjboL41H6k8XTgs2a";

type LogLevel = "info" | "warning" | "error" | "success";

const COLORS = {
  info: 3447003, // Blue
  success: 5763719, // Green
  warning: 16776960, // Yellow
  error: 15548997, // Red
};

class Logger {
  private async sendToDiscord(level: LogLevel, title: string, message: string, extra?: any) {
    if (!DISCORD_WEBHOOK_URL) return;

    try {
      // Gather Device Metadata
      const deviceName = Device.modelName || "Unknown Device";
      const osVersion = `${Platform.OS} ${Platform.Version}`;
      const appVersion = Application.nativeApplicationVersion || "1.0.0";

      const embed = {
        title: `[${level.toUpperCase()}] ${title}`,
        description: message,
        color: COLORS[level],
        fields: [
          { name: "📱 Device", value: deviceName, inline: true },
          { name: "💻 OS", value: osVersion, inline: true },
          { name: "v Ver", value: appVersion, inline: true },
        ],
        footer: { text: `Environment: ${process.env.NODE_ENV || "development"}` },
        timestamp: new Date().toISOString(),
      };

      // formatting extra data for Discord Code Block
      if (extra) {
        let extraString = "";
        try {
          extraString = typeof extra === "object" ? JSON.stringify(extra, null, 2) : String(extra);
        } catch (e) {
          extraString = "[Circular or Unserializable Object]";
        }

        // Discord limit is 1024 chars for field values
        if (extraString.length > 1000) {
          extraString = extraString.substring(0, 1000) + "\n... (truncated)";
        }

        embed.fields.push({
          name: "🔍 Technical Details",
          value: `\`\`\`json\n${extraString}\n\`\`\``,
          inline: false,
        });
      }

      // Fire and forget
      fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch((err) => console.error("Logger Fetch Error:", err));
    } catch (error) {
      console.error("Logger Internal Error:", error);
    }
  }

  // --- PUBLIC METHODS ---

  info(title: string, message: string, extra?: any) {
    console.log(`[INFO] ${title}: ${message}`);
    this.sendToDiscord("info", title, message, extra);
  }

  success(title: string, message: string, extra?: any) {
    console.log(`[SUCCESS] ${title}: ${message}`);
    this.sendToDiscord("success", title, message, extra);
  }

  warn(title: string, message: string, extra?: any) {
    console.warn(`[WARN] ${title}: ${message}`);
    this.sendToDiscord("warning", title, message, extra);
  }

  error(title: string, error: any) {
    console.error(`[ERROR] ${title}:`, error);

    // Extract useful info from Error object
    const message = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error)) || "An unknown error occurred.";
    const code = error?.code || error?.status || "N/A";
    const stack = error?.stack ? error.stack.split("\n").slice(0, 3).join("\n") : "No stack trace";

    this.sendToDiscord("error", title, message, {
      code,
      fullError: error,
      stack,
    });
  }
}

export default new Logger();
