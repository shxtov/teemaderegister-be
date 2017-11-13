module.exports = (str) => {
  let matches = str.match(/\d+$/)
  if (matches) return parseInt(matches[0]) + 1
  return 1
}
