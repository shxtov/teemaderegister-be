const slug = require('slug')

const log = require('../logger')
const User = require('../models/user')
const Token = require('../models/token')
const signToken = require('../utils/signToken')

module.exports.localLogin = async (req, res) => {
  const { email, password } = req.body
  const err = { msg: 'Email or password incorrect' }

  const user = await User.findOne({ 'login.email': email })
  if (!user) return res.status(400).send(err)

  const isMatch = await user.comparePassword(password)
  if (!isMatch) return res.status(400).send(err)

  return res.json({ token: signToken(user) })
}

module.exports.localSignup = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) { return next(new Error('Account with that email address already exists.')) }

  const user = await new User({
    profile: {
      firstName,
      lastName,
      slug: slug(firstName + ' ' + lastName)
    },
    login: {
      email,
      password
    }
  }).save()

  if (!user) return res.status(400).send({ msg: 'Could not authenticate, no user created' })

  return res.json({ success: 'User created' })
}

module.exports.logout = async (req, res) => {
  // blacklist active token
  const newToken = await new Token({
    userId: req.user.id,
    token: JSON.stringify(req.user),
    expires: req.user.exp * 1000
  }).save()

  if (!newToken) return res.status(400).send()

  log.info('token blacklisted')
  return res.json({ success: 'successfully logged out' })
}
