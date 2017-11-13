const slug = require('slug')

const User = require('../models/user')
const log = require('../utils/logger')
const { signToken, blacklistToken } = require('../utils/jwt')

const { Error } = require('../utils/errors')

module.exports.localLogin = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ 'login.email': email })
  if (!user) throw new Error('Email or password incorrect')

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw new Error('Email or password incorrect')

  return res.json({ token: signToken(user) })
}

module.exports.localSignup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body
  const existingUser = await User.findOne({ 'login.email': email })
  if (existingUser) { throw new Error('Account with that email address already exists') }
  const userSlug = await User.findOne({
    $and: [ { 'profile.lastName': lastName }, { 'profile.firstName': firstName } ]
  }, {}, {sort: {$natural: -1}})
  const user = await new User({
    profile: {
      firstName,
      lastName,
      slug: userSlug
        ? slug(firstName + ' ' + lastName + ' ' + uuSlug(userSlug.profile.slug))
        : slug(firstName + ' ' + lastName)
    },
    login: {
      email,
      password
    }
  }).save()

  if (!user) throw new Error('No user created')

  return res.json({ message: 'User created' })
}

const uuSlug = (str) => {
  let matches = str.match(/\d+$/)
  if (matches) return parseInt(matches[0]) + 1
  else return 1
}

module.exports.logout = async (req, res) => {
  // blacklist active token
  const blacklisted = await blacklistToken(req.user)
  if (!blacklisted) throw new Error('Unable to blacklist active token')

  log.info(`${req.user._id} token blacklisted`)
  return res.json({ message: 'successfully logged out' })
}
