import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Strips invalid `// ...` line comments from brandsync-tokens/tokens.css.
// Upstream emits a JS-style comment that breaks CSS parsing.
function fixBrandsyncTokens(): Plugin {
  return {
    name: 'fix-brandsync-tokens',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('brandsync-tokens') && id.endsWith('tokens.css')) {
        return { code: code.replace(/^\s*\/\/.*$/gm, ''), map: null }
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [fixBrandsyncTokens(), react()],
})
