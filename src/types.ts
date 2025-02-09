import {type z} from 'zod';

export type EndpointMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ReferenceId = string;

export type EndpointConfig = {
	requestBody?: ReferenceId;
	query?: ReferenceId;
	responses: Record<
		number,
		{
			description: string;
			schema: ReferenceId;
		}
	>;
};

export type Endpoint = {
	method: EndpointMethod;
	summary: string;
	config: EndpointConfig;
};

export type Config = {
	docs: {
		directoryPath?: string;
		title: string;
		description: string;
		version: string;
		servers?: Array<{
			url: string;
			description?: string;
		}>;
		schemas: Record<ReferenceId, z.ZodEffects<any>>;
		endpoints: Record<string, Endpoint[]>;
	};
};
