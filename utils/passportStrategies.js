const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')

/* Sign in using Email and Password. */
module.exports.LocalStrategy = new LocalStrategy(
  { usernameField: 'email', session: false },
  (email, password, next) => {
    User.findOne({ email: email.toLowerCase() })
      .then(user => {
        if (!user) {
          return Promise.reject({
            type: 'Validation',
            msg: `Email ${email} not found.`
          })
        }
        this.user = user
        return user.comparePassword(password)
      })
      .then(isMatch => {
        if (isMatch) {
          return next(null, this.user)
        }
        return Promise.reject({
          type: 'Validation',
          msg: 'Invalid email or password.'
        })
      })
      .catch(err => {
        if (err.type !== 'Validation') {
          err = {
            type: 'Server error',
            message: 'Server error'
          }
        }

        next(err)
      })
  }
)
