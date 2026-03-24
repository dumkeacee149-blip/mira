# @proj-mira/server-sdk

The SDK for cliet-side code to connect to the server-side components.

## Usage

```shell
ni @proj-mira/server-sdk -D # from @antfu/ni, can be installed via `npm i -g @antfu/ni`
pnpm i @proj-mira/server-sdk -D
yarn i @proj-mira/server-sdk -D
npm i @proj-mira/server-sdk -D
```

```typescript
import { Client } from '@proj-mira/server-sdk'

const c = new Client({ name: 'your mira plugin' })
```

## License

[MIT](../../LICENSE)
