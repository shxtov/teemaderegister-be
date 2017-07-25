const jwt = require('jsonwebtoken')
const jwtSecret = process.env.SECRET

module.exports = function(user) {
  let newExpireTimestampInSeconds =
    Math.floor(Date.now() / 1000) +
    parseInt(process.env.TOKEN_EXPIRES_IN_SECONDS)
  return jwt.sign(
    {
      id: user._id,
      ts: new Date() * 1,
      exp: newExpireTimestampInSeconds
    },
    jwtSecret
  )
}
