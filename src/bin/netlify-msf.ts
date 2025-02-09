#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../../package.json';
import docsGen from '../commands/docs-gen.js';

const program = new Command();

program
	.name('netlify-msf')
	.description(
		'A lightweight framework for building serverless microservices with Netlify Functions.',
	)
	.version(version);

program
	.command('docs-gen')
	.description('Generate OpenAPI documentation.')
	.action(async () =>
		docsGen.execute().catch((error: unknown) => {
			console.error(error);
			process.exit(1);
		}),
	);

program.parse();
