const expressJwt = require('express-jwt')
const jwt = require('jsonwebtoken')
const jwtSecret = process.env.SECRET
const validateJwt = expressJwt({ secret: jwtSecret })
const log = require('./logger')
const Token = require('../models/token')
const User = require('../models/user')
const { NotAuthorizedError, ServerError } = require('../utils/errors')

module.exports.jwtEnsure = async (req, res, next) => {
  if (!req.user) {
    // token not valid or expired
    return next(new NotAuthorizedError())
  }

  try {
    // check if blacklisted
    const isBlacklisted = await Token.findOne({ token: JSON.stringify(req.user) })
    if (isBlacklisted) {
      log.warning(`${req.user._id} tried blacklisted token ${isBlacklisted}`)

      next(new NotAuthorizedError())
    }

    // check if token valid after user data changed
    // TODO only check password reset
    const user = await User.findById(req.user._id).select('updatedAt')
    if (!user) return next(new NotAuthorizedError())

    // DO NOT allow if user password changed after last token issued
    let lastPassUpdate = Math.floor(new Date(user.updatedAt) * 1 / 1000)
    if (lastPassUpdate >= req.user.iat) {
      const blacklisted = await this.blacklistToken(req.user)

      if (!blacklisted) return next(new Error('Unable to blacklist active token'))
      log.info(`${req.user._id} token blacklisted`)

      return next(new NotAuthorizedError())
    }

    // all good, proceed
    return next()
  } catch (err) {
    next(new ServerError())
  }
}

module.exports.jwtCheck = (req, res, next) => {
  // get user from token for logging, proceed also if invalid
  return validateJwt(req, res, () => next())
}

module.exports.signToken = user => {
  let newExpireTimestampInSeconds =
    Math.floor(Date.now() / 1000) +
    parseInt(process.env.TOKEN_EXPIRES_IN_SECONDS)

  return jwt.sign(
    {
      _id: user._id,
      ts: new Date() * 1,
      exp: newExpireTimestampInSeconds
    },
    jwtSecret
  )
}

module.exports.blacklistToken = user => new Token({
  userId: user._id,
  token: JSON.stringify(user),
  expires: user.exp * 1000
}).save()
