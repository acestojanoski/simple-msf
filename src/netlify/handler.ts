import {z} from 'zod';
import {
	type Handler,
	type HandlerEvent,
	type HandlerContext,
	type HandlerResponse,
} from '@netlify/functions';
import MsfError from '../lib/msf-error.js';
import {
	logError,
	logEvent,
	logResponse,
	type ErrorLogger,
	type EventLogger,
	type ResponseLogger,
} from './logging.js';

export type IQuerySchema = z.ZodSchema;
export type IBodySchema = z.ZodSchema;

export type IRequest<
	TQuerySchema extends IQuerySchema,
	TBodySchema extends IBodySchema,
> = {
	query: z.infer<TQuerySchema>;
	body: z.infer<TBodySchema>;
};

export type IExecute<
	TQuerySchema extends IQuerySchema,
	TBodySchema extends IBodySchema,
> = (
	request: IRequest<TQuerySchema, TBodySchema>,
	event: HandlerEvent,
	context: HandlerContext,
) => HandlerResponse | Promise<HandlerResponse>;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type IHandlerOptions<
	TQuerySchema extends IQuerySchema,
	TBodySchema extends IBodySchema,
> = {
	querySchema?: TQuerySchema;
	bodySchema?: TBodySchema;
	customErrorHandler?: (
		error: any,
	) => HandlerResponse | Promise<HandlerResponse>;
	loggingEnabled?: boolean;
	eventLogger?: EventLogger;
	responseLogger?: ResponseLogger;
	errorLogger?: ErrorLogger;
	beforeRequest?: (
		event: HandlerEvent,
		context: HandlerContext,
	) => void | Promise<void> | HandlerResponse | Promise<HandlerResponse>;
	methods?: Method[];
};

const handler =
	<TQuerySchema extends IQuerySchema, TBodySchema extends IBodySchema>({
		bodySchema,
		querySchema,
		customErrorHandler,
		loggingEnabled = true,
		errorLogger,
		eventLogger,
		responseLogger,
		beforeRequest,
		methods,
	}: IHandlerOptions<TQuerySchema, TBodySchema> = {}) =>
	(execute: IExecute<TQuerySchema, TBodySchema>): Handler => {
		return async (event, context) => {
			try {
				if (
					methods &&
					!methods.includes(event.httpMethod.toUpperCase() as Method)
				) {
					return {
						statusCode: 405,
						body: 'Method not allowed.',
						headers: {
							'Content-Type': 'text/plain',
							Allow: methods.join(', '),
						},
					};
				}

				logEvent(event, {loggingEnabled, eventLogger});

				if (beforeRequest) {
					const response = await beforeRequest(event, context);

					if (response) {
						logResponse(response, {loggingEnabled, responseLogger});
						return response;
					}
				}

				const request: IRequest<TQuerySchema, TBodySchema> = {
					query: undefined,
					body: undefined,
				};

				if (querySchema) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					request.query = await querySchema.parseAsync(
						event.queryStringParameters,
					);
				}

				if (bodySchema) {
					let body;
					try {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						body = JSON.parse(event.body!);
					} catch {
						throw new z.ZodError([
							{
								code: 'custom',
								message: 'Invalid JSON body.',
								path: ['body'],
							},
						]);
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					request.body = await bodySchema.parseAsync(body);
				}

				const response = await execute(request, event, context);

				logResponse(response, {loggingEnabled, responseLogger});

				return response;
			} catch (error: any) {
				if (customErrorHandler) {
					return customErrorHandler(error);
				}

				logError(error, {loggingEnabled, errorLogger});

				if (error instanceof z.ZodError) {
					return {
						statusCode: 400,
						body: JSON.stringify({
							message: 'Bad request.',
							errors: error.errors,
						}),
					};
				}

				if (error instanceof MsfError) {
					return {
						statusCode: error.statusCode,
						body: JSON.stringify({
							message: error.message,
							errors: error.errors,
						}),
					};
				}

				return {
					statusCode: 500,
					body: JSON.stringify({
						message: 'Internal server error.',
					}),
				};
			}
		};
	};

export default handler;
