const mdxImageNodeTypes = new Set([
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
]);

function visit(node, visitor) {
  if (!node || typeof node !== 'object') return;

  visitor(node);
  if (!Array.isArray(node.children)) return;

  for (const child of node.children) {
    visit(child, visitor);
  }
}

export default function remarkLocalImageBaseUrl({baseUrl} = {}) {
  if (
    typeof baseUrl !== 'string' ||
    !baseUrl.startsWith('/') ||
    !baseUrl.endsWith('/')
  ) {
    throw new TypeError(
      'remarkLocalImageBaseUrl expects baseUrl to start and end with "/".',
    );
  }

  const baseUrlPrefix = baseUrl === '/' ? '' : baseUrl.slice(0, -1);

  return (tree) => {
    visit(tree, (node) => {
      if (!mdxImageNodeTypes.has(node.type) || node.name !== 'img') return;

      const source = node.attributes?.find(
        (attribute) =>
          attribute.type === 'mdxJsxAttribute' && attribute.name === 'src',
      );

      if (typeof source?.value !== 'string' || !source.value.startsWith('/img/')) {
        return;
      }

      // Keep /img URLs portable for Vivliostyle and adapt them only in the
      // Docusaurus AST, where native JSX image sources bypass asset handling.
      source.value = `${baseUrlPrefix}${source.value}`;
    });
  };
}
