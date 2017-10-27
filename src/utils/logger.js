const util = require('util')
const moment = require('moment')
const chalk = require('chalk')
const onFinished = require('on-finished')

const dotenv = require('dotenv')
dotenv.load({ path: '.env' })

let mail

module.exports = (() => {
  const levels = {
    EMERG: 0,
    ALERT: 1,
    CRIT: 2,
    ERR: 3,
    WARNING: 4,
    NOTICE: 5,
    INFO: 6,
    DEBUG: 7
  }

  const colormap = {
    ERR: 'red',
    WRN: 'yellow',
    NOT: 'cyan',
    INF: 'white',
    DEB: 'gray'
  }

  const output = (level, str) => {
    console.log(
      '[' +
        chalk.dim(getTimestamp()) +
        ' (' +
        chalk[colormap[level]](level) +
        ')] ' +
        str
    )
  }

  const LEVEL_ERROR = 'ERR'
  const LEVEL_WARNING = 'WRN'
  const LEVEL_NOTICE = 'NOT'
  const LEVEL_INFO = 'INF'
  const LEVEL_DEBUG = 'DEB'

  // send email if neccessery
  const noop = () => {}
  mail = noop

  const logFn = levelString => {
    if (process.env.LOG_LEVEL < levels[levelString]) return noop
    return function () {
      output(levelString, util.format.apply(this, arguments))
    }
  }

  const getTimestamp = date => {
    if (!date) { date = new Date() }
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  }

  return {
    middleWare: function () {
      const statusStyle = status => {
        if (status < 300) return chalk.green(status)
        if (status < 400) return chalk.yellow(status)
        return chalk.red(status)
      }

      return function (req, res, next) {
        const start = new Date()
        onFinished(
          res,
          function () {
            this.info(
              req.method,
              req.originalUrl,
              (req.user && req.user.id) || 'guest',
              statusStyle(res.statusCode),
              new Date() - start + 'ms'
            )
          }.bind(this)
        )
        next()
      }.bind(this)
    },

    level: process.env.LOG_LEVEL,
    debug: logFn(LEVEL_DEBUG),
    info: logFn(LEVEL_INFO),
    notice: logFn(LEVEL_NOTICE),
    warning: logFn(LEVEL_WARNING),
    error: function () {
      mail({
        subject: process.env.APP_NAME + ' error',
        message: util.format.apply(this, arguments)
      })
      if (this.level >= levels[LEVEL_ERROR]) {
        output(LEVEL_ERROR, util.format.apply(this, arguments))
      }
    }
  }
})()
