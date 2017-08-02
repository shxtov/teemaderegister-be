const express = require('express')
const router = express.Router()
const log = require('../logger')
const Curriculum = require('../models/curriculum')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')

router.get('/', (req, res) => {
  // Check if user from token exists
  Curriculum.aggregate(
    { $sort: { type: -1, name: 1 } },
    {
      $group: {
        _id: '$type',
        //collection: { $push: '$$ROOT' }, //full object
        collection: {
          $push: {
            name: '$name',
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
      response.map(o => {
        o.type = o._id
        return o
      })
      return res.json(response)
    })
    .catch(() => {
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

router.get('/:abbreviation', (req, res) => {
  // TODO check also if supervisor for creating link in frontend
  // TODO if no curriculum throw errror client side
  Curriculum.findOne({
    abbreviation: req.params.abbreviation
  })
    .populate('representative', '_id profile')
    .then(curriculumMeta => {
      if (!curriculumMeta) {
        return res.status(400).send({ msg: 'no curriculum with abbreviation' })
      }

      this.curriculumMeta = curriculumMeta

      const curriculums = { $in: [curriculumMeta._id] }

      const qAll = {
        curriculums
      }

      const qAvailable = {
        curriculums,
        accepted: { $ne: null },
        registered: null,
        defended: null
      }
      const qRegistered = {
        curriculums,
        accepted: { $ne: null },
        registered: { $ne: null },
        defended: null
      }
      const qDefended = {
        curriculums,
        accepted: { $ne: null },
        registered: { $ne: null },
        defended: { $ne: null }
      }

      const countUsers = function(users) {
        return User.count({
          _id: { $in: users }
        })
      }

      const allSupervisorsCount = Topic.distinct(
        'supervisors.supervisor',
        qAll
      ).then(users => countUsers(users))

      const supervisedSupervisorsCount = Topic.distinct(
        'supervisors.supervisor',
        qDefended
      ).then(users => countUsers(users))

      return Promise.all([
        Topic.count(qAll),
        Topic.count(qRegistered),
        Topic.count(qAvailable),
        Topic.count(qDefended),

        allSupervisorsCount,
        supervisedSupervisorsCount
      ])
    })
    .then(
      (
        [
          allTopicsCount,
          registered,
          available,
          defended,

          allSupervisorsCount,
          supervised
        ]
      ) => {
        const response = {
          curriculumMeta: this.curriculumMeta,
          topics: {
            count: {
              registered,
              available,
              defended,
              all: allTopicsCount
            }
          },
          supervisors: {
            count: {
              supervised,
              all: allSupervisorsCount
            }
          }
        }

        return res.json(response)
      }
    )
    .catch(err => {
      console.log(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

router.get('/:_id/:tab', (req, res) => {
  // TODO add check if both required and check for allowed values
  // TODO chekc req query sub
  const { _id, tab } = req.params
  const limit = 10

  const curriculums = { $in: [_id] }

  console.log(req.query.sub)
  const { sub } = req.query
  //TODO modify query to include sub
  // GET all counts for
  // available = accepted $ne null others null
  // registered = registered $ne null others null
  // defended = defended $ne null others null

  const qAll = {
    curriculums
  }

  const qAvailable = {
    curriculums,
    accepted: { $ne: null },
    registered: null,
    defended: null
  }
  let qRegistered = {
    curriculums,
    accepted: { $ne: null },
    registered: { $ne: null },
    defended: null
  }
  const qDefended = {
    curriculums,
    accepted: { $ne: null },
    registered: { $ne: null },
    defended: { $ne: null }
  }

  const subMap = {
    registered: qRegistered,
    available: qAvailable,
    defended: qDefended,
    supervised: qDefended,
    all: qAll
  }

  const getTopics = Promise.all([
    Topic.find(subMap[sub])
      .populate('supervisors.supervisor', '_id profile')
      .limit(limit),
    Topic.count(subMap[sub])
  ])

  // TODO only return supervisors if supervisors query by tab!
  const getSupervisors = Topic.distinct(
    'supervisors.supervisor',
    subMap[sub]
  ).then(users => {
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

  const promiseMap = {
    topics: getTopics,
    supervisors: getSupervisors
  }

  let promise = promiseMap[tab]

  promise
    .then(([data, count]) => {
      // if (count < 1) {
      //   return res.status(400).send({ error: { msg: 'No data found' } })
      // }
      //console.log(data)
      return res.json({ data, count })
    })
    .catch(err => {
      log.warn(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

module.exports = router
