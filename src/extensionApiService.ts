import fetch from "node-fetch";
import { EventEmitter } from "events";
import { createServer, Server } from "http";
import {
  EventTypes,
  InvokeEvent,
  ShutdownEvent,
  TelemetryEvent,
  TelemetryEventTypes,
} from "./types";

const EXTENSION_URL = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;
const TELEMETRY_URL = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2022-07-01/telemetry`;

const telemetryEvent = "telemetry-event";
const telemetryServerHostname = "sandbox.localdomain"; // This can't be modified. Other hostnames are not allowed

type ExtensionAPIServiceConfig = {
  extensionName: string;
  telemetryServerPort: number;
};

const defaultConfig: ExtensionAPIServiceConfig = {
  extensionName: "MyExtension",
  telemetryServerPort: 4242,
};
export class ExtensionAPIService {
  extensionId: string | undefined;
  telemetryEventEmitter: EventEmitter = new EventEmitter();
  telemetryServer: Server | undefined;
  config: ExtensionAPIServiceConfig;

  constructor(config: Partial<ExtensionAPIServiceConfig> = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }
  register = async (
    events: EventTypes[] = [EventTypes.Invoke, EventTypes.Shutdown]
  ): Promise<string> => {
    const response = await fetch(`${EXTENSION_URL}/register`, {
      method: "POST",
      headers: {
        "Lambda-Extension-Name": this.config.extensionName,
      },
      body: JSON.stringify({
        events,
      }),
    });
    if (response.status !== 200) {
      console.error(await response.json());
      throw new Error(
        `Unexpected register response status code: ${response.status}`
      );
    }
    this.extensionId =
      response.headers.get("lambda-extension-identifier") ?? undefined;

    if (!this.extensionId) {
      throw new Error("Unexpected register response: extension id not found");
    }

    return this.extensionId;
  };

  next = async (): Promise<InvokeEvent | ShutdownEvent> => {
    if (!this.extensionId) {
      throw new Error("Extension ID not set, please register first");
    }
    const response = await fetch(`${EXTENSION_URL}/event/next`, {
      method: "GET",
      headers: {
        "Lambda-Extension-Identifier": this.extensionId,
      },
    });
    if (response.status !== 200) {
      console.error(await response.json());
      throw new Error(
        `Unexpected next response status code: ${response.status}`
      );
    }
    return response.json() as Promise<InvokeEvent | ShutdownEvent>;
  };

  registerTelemetry = async (
    events: TelemetryEventTypes[] = [
      TelemetryEventTypes.Function,
      TelemetryEventTypes.Platform,
      TelemetryEventTypes.Extension,
    ]
  ) => {
    if (!this.extensionId) {
      throw new Error("Extension ID not set, please register first");
    }
    this.telemetryServer = createServer((request, response) => {
      if (request.method !== "POST")
        throw new Error("Unexpected request method");

      let body = "";
      request.on("data", (data) => {
        body += data;
      });
      request.on("end", () => {
        response.writeHead(200, {});
        response.end("OK");
        const data = JSON.parse(body);

        for (const event of data) {
          this.telemetryEventEmitter.emit(telemetryEvent, event);
        }
      });
    })
      .listen(this.config.telemetryServerPort, telemetryServerHostname)
      .on("error", (err) => {
        console.error("Server error: ", err);
      });

    const response = await fetch(TELEMETRY_URL, {
      method: "PUT",
      headers: {
        "Lambda-Extension-Identifier": this.extensionId,
      },
      body: JSON.stringify({
        destination: {
          protocol: "HTTP",
          URI: `http://${telemetryServerHostname}:${this.config.telemetryServerPort}`,
        },
        types: events,
        buffering: { timeoutMs: 25, maxBytes: 262144, maxItems: 1000 },
        schemaVersion: "2022-07-01",
      }),
    });

    if (response.status !== 200) {
      console.error(await response.json());
      throw new Error(
        `Unexpected telemetry register response status code: ${response.status}`
      );
    }
    return response.json();
  };

  onTelemetryEvent = (callback: (event: TelemetryEvent) => void) => {
    this.telemetryEventEmitter.on(telemetryEvent, callback);
  };
}
