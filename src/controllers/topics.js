const Topic = require('../models/topic')
const Promise = require('bluebird')
const { TopicsQuery } = require('../utils/queryHelpers')

module.exports.getTopics = async (req, res) => {
  const { query } = req
  let {
    curriculumId,
    supervisorId,
    q,
    sub,
    page,
    columnKey,
    order,
    types,
    curriculums
  } = query

  let extend = {}
  if (curriculumId) {
    extend = { curriculums: { $in: [curriculumId] } }
  }
  if (supervisorId) {
    extend = { 'supervisors.supervisor': { $in: [supervisorId] } }
  }

  if (q) {
    const relatedTopicsIds = await exports.getRelatedTopicsIds(q)

    extend = {
      _id: { $in: relatedTopicsIds }
    }
  }

  page = page || 1
  const pageSize = 20
  const skip = page !== 1 ? (page - 1) * pageSize : 0

  const defaultOrder = 1 // ascend
  order = order ? (order === 'ascend' ? 1 : -1) : defaultOrder

  const defaultSort = 'title'
  let sortKey = columnKey || defaultSort
  let sort = {}
  sort[sortKey] = order

  // TYPES SE BA
  if (types && types.length > 0) extend.types = { $in: [query.types] }

  if (curriculums && curriculums.length > 0) { extend['curriculums.1'] = { $exists: true } }

  // Aggreaget for better search if needed
  // https://stackoverflow.com/questions/30341341/mongoose-query-full-name-with-regex
  const [topics, count] = await Promise.all([
    Topic.find(TopicsQuery(sub, extend))
      .populate('supervisors.supervisor', '_id profile')
      .populate('curriculums', '_id abbreviation slugs names type')
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    Topic.count(TopicsQuery(sub, extend))
  ])

  return res.json({ topics, count, query })
}

exports.getRelatedTopicsIds = async q => (await Topic.aggregate([
  {
    $project: {
      fullName: {
        $concat: ['$author.firstName', ' ', '$author.lastName']
      },
      title: 1
    }
  },
  {
    $match: {
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } }
      ]
    }
  },
  { $project: { fullName: 0, title: 0 } }
])).reduce((arrayOfIds, topic) => [topic._id, ...arrayOfIds], [])
