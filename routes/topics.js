const express = require('express')
const router = express.Router()
const log = require('../logger')
const Topic = require('../models/topic')
const Promise = require('bluebird')
const { getQuery } = require('../services/topicService')

router.get('/', (req, res) => {
  // TODO validate query params
  const { query } = req
  const { curriculum, sub } = query
  const extend = { curriculums: { $in: [curriculum] } }
  const limit = 20

  Promise.all([
    Topic.find(getQuery(sub, extend))
      .populate('supervisors.supervisor', '_id profile')
      .limit(limit),
    Topic.count(getQuery(sub, extend))
  ])
    .then(([data, count]) => {
      return res.json({ data, count, query })
    })
    .catch(err => {
      log.warning(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

module.exports = router
