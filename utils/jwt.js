const expressJwt = require('express-jwt')
const jwtSecret = process.env.SECRET
const validateJwt = expressJwt({ secret: jwtSecret })
const log = require('../logger')
const Token = require('../models/token')
const User = require('../models/user')

module.exports.jwtEnsure = (req, res, next) => {
  validateJwt(req, res, async err => {
    try {
      const errorMsg = { error: { msg: 'Unauthorized' } }

      if (err) {
      // token not valid or expired
        return res.status(401).send(errorMsg)
      }

    // check if blacklisted
      const isBlacklisted = await Token.findOne({ token: JSON.stringify(req.user) })
      if (isBlacklisted) {
        log.info(
        'blacklisted token tried. user:' + req.user.id +
        ' token:' + isBlacklisted
      )

        return res.status(401).send(errorMsg)
      }

    // check if token valid after user data changed
    // TODO only check password reset
      const user = await User.findById(req.user.id).select('updatedAt')
      if (!user) return res.status(401).send(errorMsg)

    // DO NOT allow if user password changed after last token issued
      let lastPassUpdate = Math.floor(new Date(user.updatedAt) * 1 / 1000)
      if (lastPassUpdate >= req.user.iat) {
        await new Token({
          userId: req.user.id,
          token: JSON.stringify(req.user),
          expires: req.user.exp * 1000
        }).save()

        log.info('token blacklisted')
        return res.status(401).send(errorMsg)
      }

    // all good, proceed
      return next()
    } catch (err) {
      log.error(err)
      return res.status(500).send()
    }
  })
}

module.exports.jwtCheck = (req, res, next) => {
  // get user from token, proceed also if invalid
  return validateJwt(req, res, () => next())
}
