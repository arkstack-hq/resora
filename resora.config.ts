import { defineConfig } from './src/utilities'

export default defineConfig({
  resourcesDir: 'src/dev/http/resources',
  stubs: {
    resource: 'resource.stub',
  },
})