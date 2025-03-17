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
// simple-msf.config.ts
import { Config } from 'simple-msf';
import UsersSchema from './UsersSchema';

const config: Config = {
  schemas: {
    UsersSchema,
  },
  openapi: {
    definition: {
      title: "My microservice",
      description: "Description about my microservice.",
      version: "1.0.0",
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
        },
      },
    },
  },
};
```

### Generating OpenAPI Documentation

Run the following command to generate an `openapi.yaml` file at the root level or in the specified `outputDir`:

```sh
simple-msf openapi-gen
```

## Netlify

### API Handler

The library exports a `handler` function that wraps Netlify functions with Zod-based request validation.

#### Usage Example

```typescript
import * as msfNetlify from 'simple-msf/netlify';
import { z } from 'zod';

const querySchema = z.object({ id: z.string() });
const bodySchema = z.object({ name: z.string() });

export const handler = msfNetlify.handler({ querySchema, bodySchema })((request, event, context) => {
  return {
    message: `Hello, ${request.body.name}!`
  };
});
```

## Error Handling

`SimpleMsfError` is a custom error class for handling API errors gracefully.

### Example:

```typescript
import { SimpleMsfError } from 'simple-msf';

throw new SimpleMsfError(400, "Invalid request");
```

## License

MIT
