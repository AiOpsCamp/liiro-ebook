import axios from "axios";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";

export type SeverityLevel = "info" | "warn" | "error" | "critical";

interface BugReportPayload {
  message: string;
  stack?: string;
  severity?: SeverityLevel;
  screen?: string;
  extra?: string;
  userId?: string;
}

class BugReporter {
  public static async report(payload: BugReportPayload): Promise<void> {
    try {
      const { message, stack, severity = "error", screen, extra, userId } = payload;

      const device = `${Device.brand} ${Device.modelName} - ${Platform.OS} ${Device.osVersion}`;
      const appVersion = Application.nativeApplicationVersion || "unknown";

      const body = {
        message,
        stack,
        platform: Platform.OS,
        appVersion,
        device,
        userId,
        severity,
        screen,
        extra,
      };

      // await axios.post(BugReporter.endpoint, body);
    } catch (error: any) {
      console.warn("❌ Failed to send bug report:", error.message);
    }
  }
}

export default BugReporter;
