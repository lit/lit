const path = require('path').posix;

module.exports = (base, p) => {
  const relativePath = path.relative(base, p);
  if (p.endsWith('/') && !relativePath.endsWith('/') && relativePath !== '') {
    return relativePath + '/';
  }
  return relativePath;
};
