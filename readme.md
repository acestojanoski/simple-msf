# netlify-msf

> A lightweight framework for building serverless microservices with Netlify Functions.

---

<p align="center"><strong>WORK IN PROGRESS</strong></p>

<p align="center"><strong>Status:</strong> Functional, but incomplete.</p>

---

## Installation

You can install `netlify-msf` using npm, yarn, or pnpm:

```sh
npm install netlify-msf
# or
yarn add netlify-msf
# or
pnpm add netlify-msf
```

## CLI Usage

`netlify-msf` provides a command-line interface to manage your microservice framework.

```sh
Usage: netlify-msf [options] [command]

A lightweight framework for building serverless microservices with Netlify Functions.

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  docs-gen        Generate OpenAPI documentation.
  help [command]  display help for command
```

## Configuration

The framework relies on a `netlify-msf.config.ts` file at the root level of your repository to define API endpoints and OpenAPI documentation.

### Registering Endpoints

The `registerEndpoint` utility simplifies endpoint configuration creation.

#### Example:

```typescript
// UsersSchema.ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const UsersSchema = z.array(UserSchema);

export default UsersSchema;
```

```typescript
// netlify-msf.config.ts
import registerEndpoint from 'netlify-msf';
import { Config } from 'netlify-msf';
import UsersSchema from './UsersSchema';

const config: Config = {
  docs: {
    directoryPath: "./docs",
    title: "My microservice",
    description: "Description about my microservice.",
    version: "1.0.0",
    schemas: {
      UsersSchema,
    },
    endpoints: {
      "/users": [
        registerEndpoint("get", "Get all users", {
          responses: {
            200: {
              description: "Success.",
              schema: "UsersSchema",
            },
          },
        }),
      ],
    },
  },
};
```

### Generating OpenAPI Documentation

Run the following command to generate an `openapi.yaml` file at the root level or in the specified `directoryPath`:

```sh
netlify-msf docs-gen
```

## API Handler

The library exports a `handler` function that wraps Netlify functions with Zod-based request validation.

### Usage Example

```typescript
import * as msf from 'netlify-msf';
import { z } from 'zod';

const querySchema = z.object({ id: z.string() });
const bodySchema = z.object({ name: z.string() });

export const handler = msf.handler({ querySchema, bodySchema })((request, event, context) => {
  return {
    message: `Hello, ${request.body.name}!`
  };
});
```

## Error Handling

`MsfError` is a custom error class for handling API errors gracefully.

### Example:

```typescript
import { MsfError } from 'netlify-msf';

throw new MsfError(400, "Invalid request");
```

## License

MIT
