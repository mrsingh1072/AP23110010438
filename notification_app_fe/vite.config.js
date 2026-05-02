import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var currentDir = path.dirname(fileURLToPath(import.meta.url));
var workspaceRoot = path.resolve(currentDir, '..');
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        strictPort: true,
        fs: {
            allow: [workspaceRoot],
        },
        proxy: {
            '/evaluation-service': {
                target: 'http://20.207.122.201',
                changeOrigin: true,
                rewrite: function (path) { return path; },
                secure: false,
            },
        },
    },
});
