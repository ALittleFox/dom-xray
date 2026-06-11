module.exports = function simpleLoader(source) {
  console.error("[SIMPLE LOADER] called:", this.resourcePath);
  return source;
};
