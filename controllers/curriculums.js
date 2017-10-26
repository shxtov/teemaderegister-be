const Curriculum = require('../models/curriculum')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { TopicsQuery } = require('../utils/queryHelpers')

module.exports.getCurriculums = async (req, res) => {
  const response = await Curriculum.aggregate(
    { $sort: { type: -1, name: 1 } },
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

  // TODO make react use _id
  response.map(o => {
    o.type = o._id
    return o
  })

  return res.json(response)
}

module.exports.getCurriculumBySlug = async (req, res) => {
  // TODO check also if supervisor for creating link in frontend
  // TODO if no curriculum throw errror client side
  const curriculumMeta = await Curriculum
    .findOne({ 'slugs.et': req.params.slug })
    .populate('representative', '_id profile')

  if (!curriculumMeta) {
    return res.status(400).send({ msg: 'no curriculum with abbreviation' })
  }

  const extend = { curriculums: { $in: [curriculumMeta._id] } }
  const countUsers = users => User.count({ _id: { $in: users } })

  // TODO count after all query as in topics
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

  const response = {
    data: curriculumMeta,
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

  return res.json(response)
}
