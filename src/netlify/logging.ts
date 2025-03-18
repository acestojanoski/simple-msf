import {type HandlerEvent, type HandlerResponse} from '@netlify/functions';

export type EventLogger = (event: HandlerEvent) => void;
export type ResponseLogger = (response: HandlerResponse) => void;
export type ErrorLogger = (error: any) => void;

export const logResponse = (
	response: HandlerResponse,
	{
		loggingEnabled,
		responseLogger,
	}: {
		loggingEnabled?: boolean;
		responseLogger?: ResponseLogger;
	},
) => {
	if (loggingEnabled && !responseLogger) {
		console.info('response', JSON.stringify(response));
	}

	if (responseLogger) {
		responseLogger(response);
	}
};

export const logEvent = (
	event: HandlerEvent,
	{
		loggingEnabled,
		eventLogger,
	}: {
		loggingEnabled?: boolean;
		eventLogger?: EventLogger;
	},
) => {
	if (loggingEnabled && !eventLogger) {
		console.log('event', JSON.stringify(event));
	}

	if (eventLogger) {
		eventLogger(event);
	}
};

export const logError = (
	error: any,
	{
		loggingEnabled,
		errorLogger,
	}: {
		loggingEnabled?: boolean;
		errorLogger?: ErrorLogger;
	},
) => {
	if (loggingEnabled && !errorLogger) {
		console.error('error', error);
	}

	if (errorLogger) {
		errorLogger(error);
	}
};
