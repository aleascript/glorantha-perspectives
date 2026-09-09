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

const copy = {
  fr: {
    title: 'Publications',
    description: 'Éditions téléchargeables de Glorantha Perspectives.',
    intro: 'Téléchargez les éditions générées à partir du corpus du site.',
    version: 'Version',
    revision: 'Révision',
    unavailable: "Aucune publication générée n'est disponible dans ce build.",
    loading: 'Chargement des publications…',
  },
  en: {
    title: 'Publications',
    description: 'Downloadable editions of Glorantha Perspectives.',
    intro: 'Download editions generated from the site corpus.',
    version: 'Version',
    revision: 'Revision',
    unavailable: 'No generated publication is available in this build.',
    loading: 'Loading publications…',
  },
} as const;

export default function PublicationsPage(): React.ReactNode {
  const {i18n, siteConfig} = useDocusaurusContext();
  const locale = i18n.currentLocale;
  const text = locale === 'en' ? copy.en : copy.fr;
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
    return () => {
      cancelled = true;
    };
  }, [manifestUrl]);

  const localized =
    manifest?.publications
      .map((publication) => ({publication, locale: publication.locales[locale]}))
      .filter((entry) => entry.locale) ?? [];

  return (
    <Layout title={text.title} description={text.description}>
      <main className="container margin-vert--lg publications-page">
        <header className="publications-header">
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          {manifest ? (
            <p className="publications-version">
              {text.version} : <strong>{manifest.version}</strong>
            </p>
          ) : null}
        </header>

        {failed ? (
          <div className="alert alert--warning">{text.unavailable}</div>
        ) : null}
        {!manifest && !failed ? <p>{text.loading}</p> : null}

        <div className="publications-grid">
          {localized.map(({publication, locale: localizedPublication}) => (
            <article className="publication-card" key={publication.id}>
              <h2>{localizedPublication.title}</h2>
              {publication.revision ? (
                <p className="publication-revision">
                  {text.revision} : {publication.revision}
                </p>
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
