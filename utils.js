const parseXML = (xmlData) => {
    const parser = new DOMParser;
    const doc = parser.parseFromString(xmlData, "text/xml");
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      throw new Error('notRSS')
    } else {
      return doc;
    }
};

export { parseXML }; 