const Curriculum = require('../models/curriculum')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { TopicsQuery } = require('../utils/queryHelpers')

const { Error } = require('../utils/errors')

module.exports.getCurriculums = async (req, res) => {
  const curriculums = await Curriculum.aggregate(
    { $sort: { type: -1, 'names.et': 1 } },
    {
      $group: {
        _id: '$type',
        // collection: { $push: '$$ROOT' }, //full object
        collection: {
          $push: {
            names: '$names',
            slugs: '$slugs',
            _id: '$_id',
            abbreviation: '$abbreviation',
            languages: '$languages'
          }
        },
        count: { $sum: 1 }
      }
    }
  )

  curriculums.map(o => {
    o.type = o._id
    return o
  })

  return res.json({ curriculums })
}

module.exports.getCurriculumBySlug = async (req, res) => {
  const curriculumMeta = await Curriculum
    .findOne({ 'slugs.et': req.params.slug })
    .populate('representative', '_id profile')

  if (!curriculumMeta) throw new Error(`no curriculum with slug ${req.params.slug}`)

  const extend = { curriculums: { $in: [curriculumMeta._id] } }
  const countUsers = users => User.count({ _id: { $in: users } })

  const [
    all,
    registered,
    available,
    defended,
    allSupervisors,
    supervised
  ] = await Promise.all([
    Topic.count(TopicsQuery('all', extend)),
    Topic.count(TopicsQuery('registered', extend)),
    Topic.count(TopicsQuery('available', extend)),
    Topic.count(TopicsQuery('defended', extend)),
    Topic.distinct('supervisors.supervisor', TopicsQuery('all', extend))
      .then(users => countUsers(users)),
    Topic.distinct('supervisors.supervisor', TopicsQuery('defended', extend))
      .then(users => countUsers(users))
  ])

  const data = {
    meta: curriculumMeta,
    topics: {
      registered,
      available,
      defended,
      all
    },
    supervisors: {
      supervised,
      all: allSupervisors
    }
  }

  return res.json(data)
}
