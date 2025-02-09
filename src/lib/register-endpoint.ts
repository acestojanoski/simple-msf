import {
	type Endpoint,
	type EndpointConfig,
	type EndpointMethod,
} from '../types.js';

const registerEndpoint = (
	method: EndpointMethod,
	summary: string,
	config: EndpointConfig,
): Endpoint => ({
	method,
	summary,
	config,
});

export default registerEndpoint;
