import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://pablojmichel.com',
  output: 'server',
  adapter: vercel(),
  security: {
    checkOrigin: false
  }
});
