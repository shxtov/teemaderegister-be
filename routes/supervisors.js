const express = require('express')
const router = express.Router()
const log = require('../logger')
const Topic = require('../models/topic')
const User = require('../models/user')
const Promise = require('bluebird')
const { getQuery } = require('../services/topicService')
const moment = require('moment')

router.get('/', (req, res) => {
  // TODO validate query params
  const { query } = req
  let { curriculumId, sub, page, columnKey, order } = query
  const extendIn = { curriculums: { $in: [curriculumId] } }
  const extendNin = { curriculums: { $nin: [curriculumId] } }

  page = page || 1
  let pageSize = 20
  let skip = page !== 1 ? (page - 1) * pageSize : 0

  // get previous school year
  const substract = moment()
    .subtract(8, 'months')
    .isBefore(moment().startOf('year'))
  const year = substract
    ? moment().startOf('year').subtract(1, 'year')
    : moment().startOf('year')
  const yearStart = year.clone().subtract(4, 'months')
  const yearEnd = year.clone().add(8, 'months')

  const limit = 20

  Topic.distinct('supervisors.supervisor', getQuery(sub, extendIn))
    .then(users => {
      const userQuery = {
        _id: { $in: users }
      }

      this.count = users.length

      return User.find(userQuery)
        .select('_id profile')
        .sort({ 'profile.firstName': 1, 'profile.lastName': 1 })
        .lean()
        .then(users =>
          Promise.map(users, user => {
            extendIn['supervisors.supervisor'] = user._id
            extendNin['supervisors.supervisor'] = user._id

            return Promise.all([
              Topic.find(getQuery('all', extendIn)).select(
                'accepted registered defended'
              ),
              Topic.count(getQuery('all', extendNin))
            ]).then(([data, otherCurriculum]) => {
              user.counts = {
                //all: data.length,
                defended: data.filter(t => t.defended).length,
                defendedLastYear: data
                  .filter(t => {
                    return t.defended
                  })
                  .filter(t => {
                    // fix date to timestamp
                    return moment(t.defended).isBetween(
                      yearStart,
                      yearEnd,
                      '[]'
                    )
                  }).length,
                registered: data.filter(t => t.registered && !t.defended)
                  .length,
                available: data.filter(
                  t => t.accepted && !t.registered && !t.defended
                ).length,
                otherCurriculum
              }
              return user
            })
          })
        )
    })
    .then(data => {
      order = order === 'descend' ? 1 : -1
      data.sort((a, b) => {
        if (columnKey === 'supervisor') {
          if (a.profile.firstName < b.profile.firstName) {
            return order
          }
          if (a.profile.firstName > b.profile.firstName) {
            return order === 1 ? -1 : 1
          }

          if (a.profile.lastName < b.profile.lastName) {
            return order
          }
          if (a.profile.lastName > b.profile.lastName) {
            return order === 1 ? -1 : 1
          }
        }

        if (a.counts[columnKey] < b.counts[columnKey]) {
          return order
        } else {
          return order === 1 ? -1 : 1
        }
      })

      // Fix do not go over page size
      let startIndex = skip > 0 ? skip - 1 : skip // for index
      let endIndex = (page > 1 ? page * limit : limit) - 1 // for index
      endIndex = endIndex > data.length ? data.length : endIndex
      data = data.length > limit ? data.slice(startIndex, endIndex) : data

      return res.json({
        data,
        count: this.count,
        query
      })
    })
    .catch(err => {
      log.warning(err)
      return res.status(500).send({ error: { msg: 'Server error' } })
    })
})

module.exports = router
