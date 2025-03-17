import {
	type Handler,
	type HandlerEvent,
	type HandlerContext,
	type HandlerResponse,
} from '@netlify/functions';
import {z} from 'zod';

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
	eventLogger?: (event: HandlerEvent) => void;
	responseLogger?: (response: HandlerResponse) => void;
	errorLogger?: (error: any) => void;
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
	}: IHandlerOptions<TQuerySchema, TBodySchema> = {}) =>
	(execute: IExecute<TQuerySchema, TBodySchema>): Handler => {
		return async (event, context) => {
			try {
				if (loggingEnabled && !eventLogger) {
					console.log('event', JSON.stringify(event));
				}

				if (eventLogger) {
					eventLogger(event);
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

				if (loggingEnabled && !responseLogger) {
					console.info('response', JSON.stringify(response));
				}

				if (responseLogger) {
					responseLogger(response);
				}

				return response;
			} catch (error: any) {
				if (customErrorHandler) {
					return customErrorHandler(error);
				}

				if (loggingEnabled && !errorLogger) {
					console.error('error', error);
				}

				if (errorLogger) {
					errorLogger(error);
				}

				if (error instanceof z.ZodError) {
					return {
						statusCode: 400,
						body: JSON.stringify({
							message: 'Bad request.',
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
