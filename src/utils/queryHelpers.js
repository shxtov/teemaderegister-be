exports.TopicsQuery = (type, extra) => {
  const all = {}

  const available = {
    accepted: { $ne: null },
    registered: null,
    defended: null
  }
  const registered = {
    accepted: { $ne: null },
    registered: { $ne: null },
    defended: null
  }
  const defended = {
    accepted: { $ne: null },
    registered: { $ne: null },
    defended: { $ne: null }
  }

  const map = {
    registered,
    available,
    defended,
    supervised: defended,
    all
  }

  const query = map[type] || all
  return extra ? Object.assign(query, extra) : query
}
