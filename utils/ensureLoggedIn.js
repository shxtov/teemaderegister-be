const expressJwt = require('express-jwt')
const jwtSecret = process.env.SECRET
const validateJwt = expressJwt({ secret: jwtSecret })
const log = require('../logger')
const Token = require('../models/token')
const User = require('../models/user')

module.exports = function(req, res, next) {
  validateJwt(req, res, function(err) {
    if (err) {
      // token not valid or expired
      return res.status(401).send({ error: 'Unauthorized' })
    }

    // check if blacklisted
    Token.findOne({ token: JSON.stringify(req.user) })
      .then(isBlacklisted => {
        if (isBlacklisted) {
          log.info(
            'blacklisted token tried. user:' +
              req.user.id +
              ' token:' +
              isBlacklisted
          )
          return Promise.reject({ msg: 'Unauthorized' })
        }
        // check if token valid after user data changed
        // TODO only check password reset
        return User.findById(req.user.id).select('updatedAt')
      })
      .then(user => {
        if (!user) return Promise.reject({ msg: 'Unauthorized' })
        let lastPassUpdate = Math.floor(new Date(user.updatedAt) * 1 / 1000)

        // allow only if user password not changed after last token issued
        if (lastPassUpdate < req.user.iat) return Promise.resolve()

        let newToken = new Token({
          userId: req.user.id,
          token: JSON.stringify(req.user),
          expires: req.user.exp * 1000
        })
        return newToken.save().then(() => {
          log.info('token blacklisted')
          return Promise.reject({ msg: 'Unauthorized' })
        })
      })
      .then(() => {
        return next()
      })
      .catch(err => {
        return res.status(401).send({ error: err })
      })
  })
}
