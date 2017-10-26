const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      image: { type: String }
    },

    // optional
    // TODO check for unique email
    login: {
      email: { type: String },
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
userSchema.pre('save', async function (next) {
  try {
    const user = this
    if (!user.isModified('login.password')) {
      return next()
    }

    const salt = await bcrypt.genSalt(10)
    const hash = bcrypt.hash(user.login.password, salt)

    user.login.password = hash
    return next()
  } catch (err) {
    return next(err)
  }
})

/**
* Helper method for validating user's password on login through user.comparePassword
* Important! Do not use arrow function, will lose ref to (this)
*/
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.login.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User
