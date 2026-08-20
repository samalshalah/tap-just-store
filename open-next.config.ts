import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No R2 incremental cache binding for the first deploy — add
// r2IncrementalCache back once the R2 buckets exist on the account.
export default defineCloudflareConfig({});
