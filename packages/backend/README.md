# Backend

Convex backend functions for the Xplorer application.

## Usage in Other Packages

### Importing the API

For ESM-compatible imports in other workspace packages

```typescript
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'

// Use the api object with full type safety
const client = await convexClient.query(api.clients.getClientBySlug, {
  slug: 'my-client',
})
```

## License

Private - xplorer Internal Use Only
