const express = require('express')
const router = express.Router()
const log = require('../logger')
const Curriculum = require('../models/curriculum')
router.get('/', (req, res) => {
  // Check if user from token exists
  Curriculum.aggregate(
    { $sort: { type: -1, name: 1 } },
    {
      $group: {
        _id: '$type',
        //collection: { $push: '$$ROOT' }, //full object
        collection: {
          $push: { name: '$name', _id: '$_id', abbreviation: '$abbreviation' }
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

module.exports = router
