const mdxImageNodeTypes = new Set([
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
]);

function imageRole(source) {
  if (source.includes('/img/runes/')) return 'rune';
  if (source.includes('/img/narratives/')) return 'illustration';
  return null;
}

function attributeValue(attribute) {
  if (typeof attribute?.value === 'string') return attribute.value;
  if (typeof attribute?.value?.value === 'string') return attribute.value.value;
  return '';
}

function addAttribute(node, name, value) {
  node.attributes ??= [];

  if (
    node.attributes.some(
      (attribute) =>
        attribute.type === 'mdxJsxAttribute' && attribute.name === name,
    )
  ) {
    return;
  }

  node.attributes.push({type: 'mdxJsxAttribute', name, value});
}

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

      if (typeof source?.value === 'string' && source.value.startsWith('/img/')) {
        // Native JSX image sources bypass Docusaurus's asset loader. Keep their
        // canonical /img URL in Markdown and add the deployment base URL only
        // in the web AST. Markdown images continue through the native loader.
        source.value = `${baseUrlPrefix}${source.value}`;
      }

      const role = imageRole(attributeValue(source));
      if (role) addAttribute(node, 'data-image', role);
    });
  };
}
