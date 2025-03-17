#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../../package.json';
import openapiGen from '../commands/openapi-gen.js';

const program = new Command();

program
	.name('simple-msf')
	.description('A simple framework for building microservices.')
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
