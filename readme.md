# simple-msf

> A simple framework for building microservices.

---

<p align="center"><strong>WORK IN PROGRESS</strong></p>

<p align="center"><strong>Status:</strong> Functional, but incomplete.</p>

---

## Installation

You can install `simple-msf` using npm, yarn, or pnpm:

```sh
npm install simple-msf
# or
yarn add simple-msf
# or
pnpm add simple-msf
```

## CLI Usage

`simple-msf` provides a command-line interface to manage your microservice framework.

```sh
Usage: simple-msf [options] [command]

A simple framework for building microservices.

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  openapi-gen     Generate OpenAPI documentation.
  help [command]  display help for command
```

## Configuration

The framework relies on a `simple-msf.config.ts` file at the root level of your repository to define API endpoints and OpenAPI documentation.

#### Example:

```typescript
// schemas/UsersSchemas.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const UsersSchema = z.array(UserSchema);

export const CreateUserSchema = z.object({
  name: z.string(),
});

export const SearchUserQuerySchema = z.object({
  name: z.string().optional(),
});
```

```typescript
// simple-msf.config.ts
import { Config } from 'simple-msf';
import { UserSchema, UsersSchema, CreateUserSchema, SearchUserQuerySchema } from './schemas/UsersSchemas';

const config: Config = {
  schemas: {
    UserSchema,
    UsersSchema,
    CreateUserSchema,
    SearchUserQuerySchema,
  },
  openapi: {
    definition: {
      title: "My microservice",
      description: "Description about my microservice.",
      version: "1.0.0",
      servers: [
        {
          url: "https://api.example.com",
          description: "Production Server",
        },
      ],
      paths: {
        "/users": {
          get: {
            summary: "Get all users",
            responses: {
              200: {
                description: "Success.",
                schema: "UsersSchema",
              },
            },
          },
          post: {
            summary: "Create a user",
            body: "CreateUserSchema",
            security: ["BearerAuth"], // Securing only this endpoint with BearerAuth
            responses: {
              201: {
                description: "User created.",
                schema: "UserSchema",
              },
            },
          },
        },
        "/users/search": {
          get: {
            summary: "Search users by name",
            query: "SearchUserQuerySchema", // Referencing query schema
            responses: {
              200: {
                description: "Users found.",
                schema: "UsersSchema",
              },
            },
          },
        },
      },
      securitySchemes: [
        {
          schemeName: "ApiKeyAuth",
          type: "apiKey",
          in: "header",
          name: "X-API-KEY",
          description: "API Key authentication",
        },
        {
          schemeName: "BasicAuth",
          type: "http",
          scheme: "basic",
          description: "Basic authentication",
        },
        {
          schemeName: "BearerAuth",
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT authentication",
        },
        {
          schemeName: "OpenID",
          type: "openIdConnect",
          openIdConnectUrl: "https://example.com/.well-known/openid-configuration",
        },
      ],
      security: ["ApiKeyAuth"], // Applies globally unless overridden at the endpoint level
    },
    outputDir: "./docs",
  },
};

export default config;
```

### Generating OpenAPI Documentation

Run the following command to generate an `openapi.yaml` file at the root level or in the specified `outputDir`:

```sh
simple-msf openapi-gen
```

## Netlify

### API Handler

The library provides a `handler` function to simplify building Netlify serverless functions with request validation.

#### Features:

- **Query and body validation** using `zod`
- **Custom error handling** via `customErrorHandler`
- **Request lifecycle hooks** like `beforeRequest`
- **Method restriction** to control allowed HTTP methods
- **Logging** for incoming requests and responses

#### Usage Example

```typescript
import {HandlerEvent, HandlerContext} from '@netlify/functions';
import * as msfNetlify from 'simple-msf/netlify';
import { z } from 'zod';

const querySchema = z.object({ id: z.string() });
const bodySchema = z.object({ name: z.string() });

const beforeRequest = (event: HandlerEvent, context: HandlerContext) => {
	console.log("Incoming request:", event);
}

const customErrorHandler = (error: any) => {
	return {
		statusCode: 500,
		body: JSON.stringify({ message: "Custom error handling", error }),
	}
}

export const handler = msfNetlify.handler({
  querySchema,
  bodySchema,
  methods: ["POST"], // Allow only POST requests
  beforeRequest,
  customErrorHandler,
})((request, event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Hello, ${request.body.name}!` }),
  };
});
```

#### Handler Options:

| Option              | Type                                           | Required | Default Value | Description |
|---------------------|----------------------------------------------|----------|---------------|-------------|
| `querySchema`      | `z.ZodSchema`                                 | ❌        | `undefined`   | Schema for query string validation |
| `bodySchema`       | `z.ZodSchema`                                 | ❌        | `undefined`   | Schema for body validation |
| `methods`          | `("GET" \| "POST" \| "PUT" \| "PATCH" \| "DELETE")[]` | ❌        | `undefined` (allows all methods) | Restrict allowed HTTP methods |
| `beforeRequest`    | `(event, context) => void \| Promise<void> \| HandlerResponse \| Promise<HandlerResponse>` | ❌        | `undefined`   | Hook executed before request processing |
| `customErrorHandler` | `(error) => HandlerResponse \| Promise<HandlerResponse>` | ❌        | `undefined`   | Custom error handling function |
| `loggingEnabled`   | `boolean`                                     | ❌        | `true`        | Enable or disable logging |
| `eventLogger`      | `EventLogger`                                 | ❌        | `undefined`   | Custom logger for incoming events |
| `responseLogger`   | `ResponseLogger`                              | ❌        | `undefined`   | Custom logger for responses |
| `errorLogger`      | `ErrorLogger`                                 | ❌        | `undefined`   | Custom logger for errors |

## Error Handling

`SimpleMsfError` is a custom error class that simplifies error management in API responses.

### Example:

```typescript
import { MsfError } from 'simple-msf';

throw new MsfError(400, "Invalid request");
```

### Default Error Behavior

| Error Type               | Response Status | Response Body |
|--------------------------|----------------|---------------|
| **Zod Validation Error** | `400`          | `{ message: "Bad request", errors: [...] }` |
| **SimpleMsfError**       | Custom Status  | `{ message: "...", errors: [...] }` |
| **Unhandled Error**      | `500`          | `{ message: "Internal server error" }` |

## License

MIT
