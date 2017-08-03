const express = require('express')
const router = express.Router()
const log = require('../logger')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { getQuery } = require('../services/topicService')

router.get('/', (req, res) => {
  // TODO validate query params
  const { query } = req
  const { curriculum, sub } = query
  const extend = { curriculums: { $in: [curriculum] } }
  const limit = 20

  Topic.distinct('supervisors.supervisor', getQuery(sub, extend))
    .then(users => {
      const userQuery = {
        _id: { $in: users }
      }

      const findUsers = User.find(userQuery)
        .select('_id profile')
        .sort({ 'profile.firstName': 1, 'profile.lastName': 1 })
        .limit(limit)
      const countUsers = User.count(userQuery)

      return Promise.all([findUsers, countUsers])
    })
    .then(([data, count]) => {
      return res.json({ data, count, query })
    })
    .catch(err => {
      log.warning(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

module.exports = router
