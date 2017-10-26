const log = require('../logger')
const User = require('../models/user')
const Token = require('../models/token')
const signToken = require('../utils/signToken')

module.exports.getUser = async (req, res) => {
  // Check if user from token exists
  const user = await User.findById(req.user.id)

  if (!user) return res.status(401).send({ error: { msg: 'Unauthorized' } })

  let response = {
    user: {
      _id: user._id,
      email: user.email,
      updatedAt: user.updatedAt
    }
  }

  // update token if more than X seconds from last token update
  // time to send update token (1h)
  let secondsFromtoUpdate =
    req.user.iat + parseInt(process.env.TOKEN_UPDATE_IN_SECONDS)
  let currentTimestampInSecons = Date.now() / 1000
  let updateToken = secondsFromtoUpdate <= currentTimestampInSecons

  if (updateToken) {
    // save prev revoked token
    await new Token({
      userId: req.user.id,
      token: JSON.stringify(req.user),
      expires: req.user.exp * 1000
    }).save()

    log.info('token blacklisted')
    log.info('sending updated token to ' + req.user.id)

    response.token = signToken(user)
  }

  return res.json(response)
}
