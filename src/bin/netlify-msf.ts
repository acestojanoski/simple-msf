#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../../package.json';
import openapiGen from '../commands/openapi-gen.js';

const program = new Command();

program
	.name('netlify-msf')
	.description(
		'A lightweight framework for building serverless microservices with Netlify Functions.',
	)
	.version(version);

program
	.command('openapi-gen')
	.description('Generate OpenAPI documentation.')
	.action(async () =>
		openapiGen.execute().catch((error: unknown) => {
			console.error(error);
			process.exit(1);
		}),
	);

program.parse();
