import config from '../publications.config.mjs';

if (!process.env.PUBLICATION_VERSION?.trim()) {
  const initialVersion = config.release?.initialVersion;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(initialVersion ?? '')) {
    throw new Error(
      'publications.config.mjs must define release.initialVersion as YYYY-MM-DD.',
    );
  }
  process.env.PUBLICATION_VERSION = initialVersion;
}

await import('./build-publications.mjs');
