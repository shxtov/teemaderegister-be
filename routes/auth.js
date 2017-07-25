const express = require('express')
const router = express.Router()
const passport = require('passport')
const log = require('../logger')
const ensureLoggedIn = require('../utils/ensureLoggedIn')
const User = require('../models/user')
const Token = require('../models/token')
const signToken = require('../utils/signToken')

router.post('/local/login', (req, res) => {
  //accepting req.body params as keys
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('password', 'Password cannot be blank').notEmpty()
  req.sanitize('email').normalizeEmail({ remove_dots: false })

  const errors = req.validationErrors()

  if (errors) {
    return res.status(400).send(errors)
  }

  new Promise((resolve, reject) => {
    passport.authenticate('local', function(error, user) {
      if (error || !user) {
        return reject(error)
      }
      return resolve(user)
    })(req, res)
  })
    .then(user => {
      if (!user) {
        return Promise.reject({ msg: 'Could not authenticate' })
      }

      return res.json({ token: signToken(user) })
    })
    .catch(err => {
      log.warning(err)
      return res.status(400).send({ error: err })
    })
})

router.post('/local/signup', (req, res) => {
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('password', 'Password must be at least 4 characters long').len(4)
  req
    .assert('confirmPassword', 'Passwords do not match')
    .equals(req.body.password)
  req.sanitize('email').normalizeEmail({ remove_dots: false })

  const errors = req.validationErrors()

  if (errors) {
    return res.status(400).send(errors)
  }

  const newUser = new User({
    email: req.body.email,
    password: req.body.password
  })

  User.findOne({ email: req.body.email })
    .then(existingUser => {
      if (existingUser) {
        return Promise.reject({
          msg: 'Account with that email address already exists.'
        })
      }

      return newUser.save()
    })
    .then(user => {
      if (!user) {
        return Promise.reject({
          msg: 'Could not authenticate, no user created'
        })
      }

      log.info('successfully created user ' + user.id)
      return res.json({ success: 'User created' })
    })
    .catch(err => {
      log.warning(err)
      return res.status(400).send({ error: err })
    })
})

router.post('/logout', ensureLoggedIn, (req, res) => {
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
})

module.exports = router
