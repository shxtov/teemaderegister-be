const log = require('../logger')
const Curriculum = require('../models/curriculum')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { getQuery } = require('../services/topicService')

module.exports.getCurriculums = (req, res) => {
  Curriculum.aggregate(
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
    .then(response => {
      // TODO make react use _id
      response.map(o => {
        o.type = o._id
        return o
      })
      return res.json(response)
    })
    .catch(() => {
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
}

module.exports.getCurriculumBySlug = (req, res) => {
  // TODO check also if supervisor for creating link in frontend
  // TODO if no curriculum throw errror client side
  Curriculum.findOne({
    'slugs.et': req.params.slug
  })
    .populate('representative', '_id profile')
    .then(curriculumMeta => {
      if (!curriculumMeta) {
        return res.status(400).send({ msg: 'no curriculum with abbreviation' })
      }

      this.curriculumMeta = curriculumMeta
      const extend = { curriculums: { $in: [curriculumMeta._id] } }

      const countUsers = function (users) {
        return User.count({
          _id: { $in: users }
        })
      }

      // TODO count after all query as in topics
      return Promise.all([
        Topic.count(getQuery('all', extend)),
        Topic.count(getQuery('registered', extend)),
        Topic.count(getQuery('available', extend)),
        Topic.count(getQuery('defended', extend)),
        Topic.distinct(
          'supervisors.supervisor',
          getQuery('all', extend)
        ).then(users => countUsers(users)),
        Topic.distinct(
          'supervisors.supervisor',
          getQuery('defended', extend)
        ).then(users => countUsers(users))
      ])
    })
    .then(
      ([all, registered, available, defended, allSupervisors, supervised]) => {
        const response = {
          data: this.curriculumMeta,
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
    )
    .catch(err => {
      log.warning(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
}
