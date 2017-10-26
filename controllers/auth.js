const passport = require('passport')
const log = require('../logger')
const User = require('../models/user')
const Token = require('../models/token')
const signToken = require('../utils/signToken')

module.exports.localLogin = (req, res) => {
  // accepting req.body params as keys
  req.checkBody('email', 'Email is not valid').isEmail()
  req.checkBody('password', 'Password cannot be blank').notEmpty()
  req.sanitizeBody('email').normalizeEmail({ remove_dots: false })

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        let firstError = result.useFirstErrorOnly().array()[0]
        return Promise.reject({ msg: firstError })
      }

      return new Promise((resolve, reject) => {
        passport.authenticate('local', (error, user) => {
          if (error || !user) return reject(error)

          return resolve(user)
        })(req, res)
      }).then(user => {
        if (!user) return Promise.reject({ msg: 'Could not authenticate' })

        return res.json({ token: signToken(user) })
      })
    })
    .catch(err => {
      log.warning(err)
      return res.status(400).send({ msg: 'Email or password incorrect' })
    })
}

module.exports.localSignup = async (req, res, next) => {
  // console.log(req.body)
  try {
    req.assert('email', 'Email is not valid').isEmail()
    req.assert('password', 'Password must be at least 4 characters long').len(4)
    req
      .assert('confirmPassword', 'Passwords do not match')
      .equals(req.body.password)
    req.sanitize('email').normalizeEmail({ remove_dots: false })

    const errors = await req.getValidationResult().then(e => e)
    if (!errors.isEmpty()) return res.status(400).send(errors.array())

    const existingUser = await User.findOne({ email: req.body.email })
    if (existingUser) { return next(new Error('Account with that email address already exists.')) }

    const user = await new User({
      email: req.body.email,
      password: req.body.password
    }).save()
    if (!user) return next(new Error('Could not authenticate, no user created'))

    return res.json({ success: 'User created' })
  } catch (err) {
    // log.warning(err)
    return next(new Error(err))
    // return res.status(400).send({ error: err })
  }
}

module.exports.logout = (req, res) => {
  // blacklist active token
  let newToken = new Token({
    userId: req.user.id,
    token: JSON.stringify(req.user),
    expires: req.user.exp * 1000
  })
  return newToken.save().then(() => {
    log.info('token blacklisted')
    return res.json({ success: 'successfully logged out' })
  })
}
