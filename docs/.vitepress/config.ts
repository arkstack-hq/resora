import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  cleanUrls: true,
  base: '/resora/',
  title: "Resora",
  description: "A structured API response layer for Node.js and TypeScript with automatic JSON responses, collection support, and pagination handling",
  head: [
    ['link', { rel: 'icon', href: '/banner.png' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'description', content: 'A structured API response layer for Node.js and TypeScript with automatic JSON responses, collection support, and pagination handling' }],
    ['meta', { name: 'keywords', content: 'API, Node.js, TypeScript, JSON responses, collections, pagination' }],
    ['meta', { name: 'author', content: 'Toneflix' }],
    ['meta', { property: 'og:title', content: 'Resora' }],
    ['meta', { property: 'og:description', content: 'A structured API response layer for Node.js and TypeScript with automatic JSON responses, collection support, and pagination handling' }],
    ['meta', { property: 'og:image', content: '/banner.png' }],
    ['meta', { property: 'og:url', content: 'https://arcstack-hq.github.io/resora/' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Resora' }],
    ['meta', { name: 'twitter:description', content: 'A structured API response layer for Node.js and TypeScript with automatic JSON responses, collection support, and pagination handling' }],
    ['meta', { name: 'twitter:image', content: '/banner.png' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API', link: '/api/resource' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Resources', link: '/guide/resources' },
          { text: 'Collections', link: '/guide/collections' },
          { text: 'Server Response', link: '/guide/server-response' },
          { text: 'Writing Resources', link: '/guide/writing-resources' },
          { text: 'Generating Resources', link: '/guide/generating-resources' },
          { text: 'Configuration', link: '/guide/configuration' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Resource', link: '/api/resource' },
          { text: 'Resource Collection', link: '/api/resource-collection' },
          { text: 'Generic Resource', link: '/api/generic-resource' },
          { text: 'Server Response', link: '/api/server-response' },
        ]
      },
      {
        text: 'More',
        items: [
          { text: 'Roadmap', link: '/more/roadmap' },
          { text: 'Contributing', link: '/more/contributing' },
          { text: 'Changelog', link: '/more/changelog' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/arcstack-hq/resora' }
    ]
  }
})
