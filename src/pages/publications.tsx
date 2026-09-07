import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type PublicationFormat = {format: string; path: string};
type PublicationLocale = {title: string; formats: PublicationFormat[]};
type Publication = {
  id: string;
  outputName: string;
  revision: string | null;
  locales: Record<string, PublicationLocale>;
};
type PublicationManifest = {version: string; publications: Publication[]};

export default function PublicationsPage(): React.ReactNode {
  const {i18n, siteConfig} = useDocusaurusContext();
  const locale = i18n.currentLocale;
  const configuredDeploymentBaseUrl = siteConfig.customFields?.deploymentBaseUrl;
  const deploymentBaseUrl =
    typeof configuredDeploymentBaseUrl === 'string'
      ? configuredDeploymentBaseUrl
      : siteConfig.baseUrl;
  const downloadsBase = `${deploymentBaseUrl.replace(/\/?$/, '/')}downloads/`;
  const manifestUrl = `${downloadsBase}publications.json`;
  const [manifest, setManifest] = useState<PublicationManifest | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Publication manifest returned ${response.status}`);
        return response.json() as Promise<PublicationManifest>;
      })
      .then((value) => {
        if (!cancelled) setManifest(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [manifestUrl]);

  const localized =
    manifest?.publications
      .map((publication) => ({publication, locale: publication.locales[locale]}))
      .filter((entry) => entry.locale) ?? [];

  return (
    <Layout title="Publications" description="Éditions téléchargeables de Glorantha Perspectives.">
      <main className="container margin-vert--lg publications-page">
        <header className="publications-header">
          <h1>Publications</h1>
          <p>Téléchargez les éditions générées à partir du corpus du site.</p>
          {manifest ? (
            <p className="publications-version">
              Version du corpus : <strong>{manifest.version}</strong>
            </p>
          ) : null}
        </header>

        {failed ? (
          <div className="alert alert--warning">
            Aucune publication générée n'est disponible dans ce build.
          </div>
        ) : null}
        {!manifest && !failed ? <p>Chargement des publications…</p> : null}

        <div className="publications-grid">
          {localized.map(({publication, locale: localizedPublication}) => (
            <article className="publication-card" key={publication.id}>
              <h2>{localizedPublication.title}</h2>
              {publication.revision ? (
                <p className="publication-revision">Révision : {publication.revision}</p>
              ) : null}
              <div className="publication-formats">
                {localizedPublication.formats.map((asset) => (
                  <a
                    className="button button--primary button--sm"
                    href={`${downloadsBase}${asset.path}`}
                    key={asset.format}>
                    {asset.format.toUpperCase()}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    </Layout>
  );
}
