const parseXML = (xmlData) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlData, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('notRSS');
  } else {
    return doc;
  }
};

const parseRSS = (xmlData) => {
  const parsedDoc = parseXML(xmlData);
  const feedData = {
    feedTitle: parsedDoc.querySelector('title').textContent,
    description: parsedDoc.querySelector('description').textContent,
  };
  const postsData = [...parsedDoc.querySelectorAll('item')]
    .map((post) => ({
      title: post.querySelector('title').textContent,
      description: post.querySelector('description').textContent,
      link: post.querySelector('link').textContent,
    }));
  return { feedData, postsData };
};

export default parseRSS;
