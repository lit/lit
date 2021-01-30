const fs = require('fs');

module.exports = () => {
  const customElements = JSON.parse(fs.readFileSync('custom-elements.json', 'utf-8'));
  return {
    customElements,
  };
};
