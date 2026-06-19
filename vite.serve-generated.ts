import type { Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.ini': 'text/plain',
  '.3mf': 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
};

function contentTypeFor(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function resolveGeneratedAsset(root: string, urlPath: string): string | undefined {
  const publicPath = join(root, 'public', urlPath);
  if (existsSync(publicPath)) return publicPath;

  const generatedPath = join(root, 'generated', urlPath);
  if (existsSync(generatedPath)) return generatedPath;

  return undefined;
}

/**
 * Serves combinations.json and profile downloads from public/ (preferred) or
 * generated/ (fallback) during Vite dev and preview.
 */
export function serveGeneratedAssets(root: string): Plugin {
  return {
    name: 'serve-generated-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url?.split('?')[0] ?? '';
        if (urlPath !== '/combinations.json' && !urlPath.startsWith('/profiles/')) {
          next();
          return;
        }

        const assetPath = resolveGeneratedAsset(
          root,
          urlPath === '/combinations.json' ? 'combinations.json' : urlPath.slice(1),
        );

        if (!assetPath) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', contentTypeFor(assetPath));
        res.end(readFileSync(assetPath));
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url?.split('?')[0] ?? '';
        if (urlPath !== '/combinations.json' && !urlPath.startsWith('/profiles/')) {
          next();
          return;
        }

        const assetPath = resolveGeneratedAsset(
          root,
          urlPath === '/combinations.json' ? 'combinations.json' : urlPath.slice(1),
        );

        if (!assetPath) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', contentTypeFor(assetPath));
        res.end(readFileSync(assetPath));
      });
    },
  };
}
