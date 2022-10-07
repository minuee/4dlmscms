const path = require('path');

module.exports = {
  // Source files
  src: path.resolve(__dirname, '../src'),
  types: path.resolve(__dirname, '../src/types'),
  comp: path.resolve(__dirname, '../src/components'),
  build: path.resolve(__dirname, '../dist'),
  public: path.resolve(__dirname, '../public'),
};
