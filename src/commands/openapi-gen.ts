import fs from 'node:fs/promises';
import path from 'node:path';
import {
	extendZodWithOpenApi,
	OpenApiGeneratorV31,
	OpenAPIRegistry,
	type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import * as yaml from 'js-yaml';
import {z} from 'zod';
import {type SecurityScheme, type EndpointMethod} from '../types.js';
import loadConfig from '../utils/load-config.js';

extendZodWithOpenApi(z);

const fileName = 'openapi.yaml';

const registerSecurityScheme = (
	registry: OpenAPIRegistry,
	securityScheme: SecurityScheme,
) => {
	registry.registerComponent('securitySchemes', securityScheme.schemeName, {
		type: securityScheme.type,
		...(securityScheme.type === 'apiKey' && {
			in: securityScheme.in,
			name: securityScheme.name,
			description: securityScheme.description,
		}),
		...(securityScheme.type === 'http' && {
			scheme: securityScheme.scheme,
			bearerFormat: securityScheme.bearerFormat,
			description: securityScheme.description,
		}),
		...(securityScheme.type === 'openIdConnect' && {
			openIdConnectUrl: securityScheme.openIdConnectUrl,
		}),
	});
};

const buildSecurityObjects = (
	securitySchemes?: SecurityScheme[],
	whitelistedSchemes?: string[],
) => {
	if (!securitySchemes || !whitelistedSchemes) {
		return undefined;
	}

	const filteredSchemes = securitySchemes.filter((securityScheme) =>
		whitelistedSchemes.includes(securityScheme.schemeName),
	);

	return filteredSchemes.map((securityScheme) => ({
		[securityScheme.schemeName]:
			securityScheme.type === 'openIdConnect' && securityScheme.scopes
				? securityScheme.scopes
				: [],
	}));
};

const execute = async () => {
	const config = await loadConfig().then((module_) => module_.default);

	if (!config) {
		throw new Error('Missing default export in "simple-msf.config.ts" file.');
	}

	if (!config.schemas) {
		throw new Error(
			'Missing "schemas" property in "simple-msf.config.ts" file.',
		);
	}

	if (!config.openapi) {
		throw new Error(
			'Missing "openapi" property in "simple-msf.config.ts" file.',
		);
	}

	if (!config.openapi.definition) {
		throw new Error(
			'Missing "openapi.definition" property in "simple-msf.config.ts" file.',
		);
	}

	console.info('\nGenerating openapi 3.1.0 documentation...');

	const {schemas} = config;
	const {definition, outputDir} = config.openapi;
	const {
		title,
		version,
		paths,
		description,
		servers,
		securitySchemes,
		security,
	} = definition;

	const registry = new OpenAPIRegistry();
	const registeredSchemas: Record<keyof typeof schemas, z.ZodTypeAny> = {};

	for (const [referenceId, schema] of Object.entries(schemas)) {
		schema.openapi ||= z.any().openapi;
		registeredSchemas[referenceId] = registry.register(referenceId, schema);
	}

	for (const [path, endpoints] of Object.entries(paths)) {
		for (const [method, endpoint] of Object.entries(endpoints)) {
			const routeConfig: RouteConfig = {
				path,
				method: method as EndpointMethod,
				summary: endpoint.summary,
				request: {},
				responses: {},
				security: buildSecurityObjects(securitySchemes, endpoint.security),
			};

			if (endpoint.query && registeredSchemas[endpoint.query]) {
				routeConfig.request!.query = registeredSchemas[
					endpoint.query
				] as z.ZodEffects<any>;
			}

			if (endpoint.body && registeredSchemas[endpoint.body]) {
				routeConfig.request!.body = {
					description: endpoint.summary,
					content: {
						'application/json': {
							schema: registeredSchemas[endpoint.body],
						},
					},
				};
			}

			for (const [status, response] of Object.entries(endpoint.responses)) {
				routeConfig.responses[status] = {
					description: response.description,
					content: {
						'application/json': {
							schema: registeredSchemas[response.schema],
						},
					},
				};
			}

			registry.registerPath(routeConfig);
		}
	}

	if (securitySchemes) {
		for (const securityScheme of securitySchemes) {
			registerSecurityScheme(registry, securityScheme);
		}
	}

	const generator = new OpenApiGeneratorV31(registry.definitions);

	const openapi = generator.generateDocument({
		openapi: '3.1.0',
		info: {
			title,
			description,
			version,
		},
		servers,
		security: buildSecurityObjects(securitySchemes, security),
	});

	const fileContent = yaml.dump(openapi);

	const openapiPath = outputDir
		? path.join(process.cwd(), outputDir, fileName)
		: path.join(process.cwd(), fileName);

	await fs.writeFile(openapiPath, fileContent, 'utf8');

	console.info(`Documentation generated successfully. Path: ${openapiPath}\n`);
};

// eslint-disable-next-line unicorn/prevent-abbreviations
const openapiGen = {
	execute,
};

export default openapiGen;
