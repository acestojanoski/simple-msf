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
		this.name = 'MsfError';
		this.statusCode = statusCode;
		this.errors = errors;
	}
}

export const isMsfError = (error: any): error is MsfError =>
	error?.name === 'MsfError' &&
	typeof error?.statusCode === 'number' &&
	typeof error?.message === 'string';

export default MsfError;
