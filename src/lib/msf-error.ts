import {type ZodIssue} from 'zod';

class MsfError extends Error {
	statusCode: number;
	errors?: ZodIssue[];

	constructor(
		statusCode = 500,
		message = 'Internal Server Error',
		errors?: ZodIssue[],
	) {
		super(message);
		this.statusCode = statusCode;
		this.errors = errors;
	}
}

export default MsfError;
