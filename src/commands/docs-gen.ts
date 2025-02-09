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
import {type Config} from '../types.js';

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

	if (!config.docs) {
		throw new Error('Missing "docs" property in "netlify-msf.config.ts" file.');
	}

	console.info('\nGenerating openapi 3.1.0 documentation...');

	const {
		title,
		version,
		endpoints,
		description,
		schemas,
		directoryPath,
		servers,
	} = config.docs;

	const registry = new OpenAPIRegistry();
	const registeredSchemas: Record<keyof typeof schemas, z.ZodEffects<any>> = {};

	for (const [referenceId, schema] of Object.entries(schemas)) {
		schema.openapi ||= z.any().openapi;
		registeredSchemas[referenceId] = registry.register(referenceId, schema);
	}

	for (const [path, _endpoints] of Object.entries(endpoints)) {
		for (const endpoint of _endpoints) {
			const routeConfig: RouteConfig = {
				path,
				method: endpoint.method,
				summary: endpoint.summary,
				request: {},
				responses: {},
			};

			if (endpoint.config.query && registeredSchemas[endpoint.config.query]) {
				routeConfig.request!.query = registeredSchemas[endpoint.config.query];
			}

			if (
				endpoint.config.requestBody &&
				registeredSchemas[endpoint.config.requestBody]
			) {
				routeConfig.request!.body = {
					description: endpoint.summary,
					content: {
						'application/json': {
							schema: registeredSchemas[endpoint.config.requestBody],
						},
					},
				};
			}

			for (const [status, response] of Object.entries(
				endpoint.config.responses,
			)) {
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

	const openapiPath = directoryPath
		? path.join(process.cwd(), directoryPath, fileName)
		: path.join(process.cwd(), fileName);

	await fs.writeFile(openapiPath, fileContent, 'utf8');

	console.info(`Documentation generated successfully. Path: ${openapiPath}\n`);
};

// eslint-disable-next-line unicorn/prevent-abbreviations
const docsGen = {
	execute,
};

export default docsGen;
