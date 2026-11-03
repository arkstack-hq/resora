#!/usr/bin/env node

import { ensureMusket } from './musket'

await ensureMusket()
await import('./run')
