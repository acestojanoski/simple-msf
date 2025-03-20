import {type z} from 'zod';

export type EndpointMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ReferenceId = string;

export type Path = string;

export type SecuritySchemeName = string;

export type Endpoint = {
	summary: string;
	query?: ReferenceId;
	body?: ReferenceId;
	security?: SecuritySchemeName[];
	responses: Record<
		number,
		{
			description: string;
			schema: ReferenceId;
		}
	>;
};

export type ApiKeySecurityScheme = {
	schemeName: string;
	type: 'apiKey';
	in: 'query' | 'header' | 'cookie';
	name: string;
	description?: string;
};

export type HttpSecurityScheme = {
	schemeName: string;
	type: 'http';
	scheme: 'bearer' | 'basic';
	bearerFormat?: 'JWT';
	description?: string;
};

export type OpenIdConnectScheme = {
	schemeName: string;
	type: 'openIdConnect';
	openIdConnectUrl: string;
	scopes?: string[];
};

export type SecurityScheme =
	| ApiKeySecurityScheme
	| HttpSecurityScheme
	| OpenIdConnectScheme;

export type Config = {
	schemas: Record<ReferenceId, z.ZodTypeAny>;
	openapi: {
		definition: {
			title: string;
			description: string;
			version: string;
			servers?: Array<{
				url: string;
				description?: string;
			}>;
			paths: Record<
				Path,
				Partial<Record<EndpointMethod, Endpoint>> // Ensure only valid methods are used
			>;
			securitySchemes?: SecurityScheme[];
			security?: SecuritySchemeName[];
		};
		outputDir?: string;
	};
};
