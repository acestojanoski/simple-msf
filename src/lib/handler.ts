import {
	type Handler,
	type HandlerEvent,
	type HandlerContext,
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
) => any;

export type IHandlerOptions<
	TQuerySchema extends IQuerySchema,
	TBodySchema extends IBodySchema,
> = {
	querySchema?: TQuerySchema;
	bodySchema?: TBodySchema;
};

const handler =
	<TQuerySchema extends IQuerySchema, TBodySchema extends IBodySchema>({
		bodySchema,
		querySchema,
	}: IHandlerOptions<TQuerySchema, TBodySchema> = {}) =>
	(execute: IExecute<TQuerySchema, TBodySchema>): Handler => {
		return async (event, context) => {
			try {
				console.log('request', JSON.stringify(event));

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

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const result = await execute(request, event, context);

				console.info('result', JSON.stringify(result));

				return {
					statusCode: 200,
					body: JSON.stringify(result),
				};
			} catch (error: any) {
				console.error('error', error);

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
