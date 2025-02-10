import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {type Config} from '../types.js';

const configPath = path.join(process.cwd(), 'netlify-msf.config.ts');

const loadConfig = async () => {
	try {
		await fs.access(configPath);
	} catch {
		throw new Error('Missing "netlify-msf.config.ts" file.');
	}

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
};

export default loadConfig;
