import {type z} from 'zod';

export type EndpointMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ReferenceId = string;

export type Path = string;

export type Endpoint = {
	summary: string;
	query?: ReferenceId;
	body?: ReferenceId;
	responses: Record<
		number,
		{
			description: string;
			schema: ReferenceId;
		}
	>;
};

export type Config = {
	openapi: {
		definition: {
			title: string;
			description: string;
			version: string;
			servers?: Array<{
				url: string;
				description?: string;
			}>;
			schemas: Record<ReferenceId, z.ZodTypeAny>;
			paths: Record<
				Path,
				Partial<Record<EndpointMethod, Endpoint>> // Ensure only valid methods are used
			>;
		};
		outputDir?: string;
	};
};
