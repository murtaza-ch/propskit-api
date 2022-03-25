import { readFileSync } from 'fs';

// Combining all schema defs here:
const user = readFileSync('./schemas/user.graphql').toString('utf-8');
const billing = readFileSync('./schemas/billing.graphql').toString('utf-8');
const scraper = readFileSync('./schemas/scraper.graphql').toString('utf-8');
const execution = readFileSync('./schemas/execution.graphql').toString('utf-8');
const subscription = readFileSync('./schemas/subscription.graphql').toString('utf-8');
const dashboard = readFileSync('./schemas/dashboard.graphql').toString('utf-8');

export default [user, billing, scraper, execution, subscription, dashboard];
