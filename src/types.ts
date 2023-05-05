export const EventTypes = {
    Invoke: "INVOKE",
    Shutdown: "SHUTDOWN", // Shutdown event is not supported for internal extensions
} as const;
export type EventTypes = (typeof EventTypes)[keyof typeof EventTypes];

export const TelemetryEventTypes = {
    Platform: "platform",
    Function: "function",
    Extension: "extension",
} as const;
export type TelemetryEventTypes =
    (typeof TelemetryEventTypes)[keyof typeof TelemetryEventTypes];

export type InvokeEvent = {
    eventType: "INVOKE";
    deadlineMs: number; // the time and date that the function times out in Unix time milliseconds
    requestId: string; // uuid
    invokedFunctionArn: string; // Arn "arn:aws:lambda:{region}:{accountId}:function:{functionName}"
    tracing: {
        type: "X-Amzn-Trace-Id";
        value: string; // Ex: "Root=1-64550c55-7a063eab755b70f84dfd4b60;Parent=4cc5b1755b4755f9;Sampled=0;Lineage=df4dc738:0";
    };
};

export type ShutdownEvent = {
    eventType: "SHUTDOWN";
    deadlineMs: number; // the time and date that the function times out in Unix time milliseconds
    shutdownReason: string;
};

export type TelemetryEvent = unknown; // TODO: type telemetry events from https://docs.aws.amazon.com/lambda/latest/dg/telemetry-schema-reference.html and https://docs.aws.amazon.com/lambda/latest/dg/samples/telemetry-api-http-schema.zip
