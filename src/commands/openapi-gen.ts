import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
	extendZodWithOpenApi,
	OpenApiGeneratorV31,
	OpenAPIRegistry,
	type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import * as yaml from 'js-yaml';
import {build} from 'esbuild';
import {z} from 'zod';
import {type EndpointMethod, type Config} from '../types.js';

extendZodWithOpenApi(z);

const fileName = 'openapi.yaml';

const configPath = path.join(process.cwd(), 'netlify-msf.config.ts');

async function loadConfig() {
	const transpiledConfigPath = path.join(os.tmpdir(), 'netlify-msf.config.js');

	await build({
		entryPoints: [configPath],
		outfile: transpiledConfigPath,
		bundle: true,
		platform: 'node',
		format: 'cjs',
	});

	return import(transpiledConfigPath).then(
		(module_) => module_.default as {default?: Config},
	);
}

const execute = async () => {
	try {
		await fs.access(configPath);
	} catch {
		throw new Error('Missing "netlify-msf.config.ts" file.');
	}

	const config = await loadConfig().then((module_) => module_.default);

	if (!config) {
		throw new Error('Missing default export in "netlify-msf.config.ts" file.');
	}

	if (!config.openapi) {
		throw new Error(
			'Missing "openapi" property in "netlify-msf.config.ts" file.',
		);
	}

	if (!config.openapi.definition) {
		throw new Error(
			'Missing "openapi.definition" property in "netlify-msf.config.ts" file.',
		);
	}

	console.info('\nGenerating openapi 3.1.0 documentation...');

	const {definition, outputDir} = config.openapi;

	const {title, version, paths, description, schemas, servers} = definition;

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

	const generator = new OpenApiGeneratorV31(registry.definitions);

	const openapi = generator.generateDocument({
		openapi: '3.1.0',
		info: {
			title,
			description,
			version,
		},
		servers,
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
