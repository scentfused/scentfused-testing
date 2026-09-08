import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // or your respective framework plugin

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // This forces esbuild to treat .js files as .jsx
    loader: 'jsx',
    include: /src\/.*\.js$/, 
  },
});

/* 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
*/
