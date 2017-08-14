const express = require('express')
const router = express.Router()
const log = require('../logger')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { getQuery } = require('../services/topicService')

router.get('/counts', (req, res) => {
  // TODO validate q

  const { q } = req.query

  const topicExtend = {
    title: { $regex: q, $options: 'i' }
  }

  const countUsers = function(users) {
    return User.aggregate([
      {
        $match: {
          _id: { $in: users }
        }
      },
      {
        $project: {
          fullName: {
            $concat: ['$profile.firstName', ' ', '$profile.lastName']
          }
        }
      },
      { $match: { fullName: { $regex: q, $options: 'i' } } },
      { $count: 'total' }
    ]).then(count => (count[0] ? count[0].total : 0))
  }

  Promise.all([
    Topic.count(getQuery('all', topicExtend)),
    Topic.count(getQuery('registered', topicExtend)),
    Topic.count(getQuery('available', topicExtend)),
    Topic.count(getQuery('defended', topicExtend)),
    Topic.distinct('supervisors.supervisor', getQuery('all')).then(users =>
      countUsers(users)
    ),
    Topic.distinct('supervisors.supervisor', getQuery('defended')).then(users =>
      countUsers(users)
    )
  ])
    .then(
      ([all, registered, available, defended, allSupervisors, supervised]) => {
        const response = {
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
})

module.exports = router
