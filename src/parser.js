const parseRSS = (xmlData) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlData, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    const error = new Error(errorNode.textContent);
    error.isParserError = true;
    error.data = doc;
    throw error;
  }
  const feedData = {
    feedTitle: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
  };
  const postsData = [...doc.querySelectorAll('item')]
    .map((post) => ({
      title: post.querySelector('title').textContent,
      description: post.querySelector('description').textContent,
      link: post.querySelector('link').textContent,
    }));
  return { feedData, postsData };
};

export default parseRSS;
