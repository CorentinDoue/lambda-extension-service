# Lambda extension service

SDK to easily build Lambda extensions in NodeJs and typescript.

Inspired by [Simplifying internal AWS Lambda APIs](https://danwakeem.medium.com/simplifying-internal-aws-lambda-apis-25a26ab9070e)

# Installation

```bash
pnpm add lambda-extension-service
```

or if using yarn

```bash
yarn add lambda-extension-service
```

or if using npm

```bash
npm install lambda-extension-service
```

## Usage

```typescript
import { EventTypes, ExtensionAPIService, TelemetryEventTypes } from "lambda-extension-service";

(async () => {
  const extensionApiService = new ExtensionAPIService({ extensionName: "my-extension" });
  await extensionApiService.register([EventTypes.Invoke, EventTypes.Shutdown]);
  extensionApiService.onTelemetryEvent((event) => 
      console.log("Telemetry event received: ", JSON.stringify(event))
  );
  await extensionApiService.registerTelemetry([
      TelemetryEventTypes.Function,
      TelemetryEventTypes.Platform,
      TelemetryEventTypes.Extension,
  ]);

  while (true) {
      const event = await extensionApiService.next();
      console.log("Next lambda event received: ", JSON.stringify(event));
  }
})().catch((err) => console.error(err));
```

A complete example can be found on [Example repository](https://github.com/CorentinDoue/lambda-internal-extension-example)

## Documentation

To fully understand the lambda extensions, I recommend reading or watching:
- [Simplifying internal AWS Lambda APIs](https://danwakeem.medium.com/simplifying-internal-aws-lambda-apis-25a26ab9070e)
- [Julian Wood Youtube video on the subject](https://www.youtube.com/watch?v=sAgUcJOwElU&ab_channel=ServerlessLand)
- [Power up your serverless application with AWS Lambda extensions](https://dev.to/kumo/power-up-your-serverless-application-with-aws-lambda-extensions-3a31)

