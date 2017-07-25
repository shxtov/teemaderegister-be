const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      image: { type: String }
    },

    // optional
    login: {
      email: { type: String, unique: true },
      password: { type: String },
      passwordResetToken: String,
      passwordResetExpires: Date
    },

    settings: {
      language: { type: String }
    }
  },
  {
    timestamps: true
  }
)

/**
* Password hash middleware.
* Important! Do not use arrow function, will lose ref to (this)
*/
userSchema.pre('save', function(next) {
  const user = this
  if (!user.isModified('password')) {
    return next()
  }
  return bcrypt
    .genSalt(10)
    .then(salt => {
      return bcrypt.hash(user.password, salt)
    })
    .then(hash => {
      user.password = hash
      return next()
    })
    .catch(err => {
      return next(err)
    })
})

/**
* Helper method for validating user's password on login through user.comparePassword
* Important! Do not use arrow function, will lose ref to (this)
*/
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User
