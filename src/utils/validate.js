
const { body, validationResult } = require('express-validator/check')
const { UnprocessableEntityError } = require('./errors')

const errorCheck = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg
    return next(new UnprocessableEntityError(message))
  }
  next()
}

const passwordMinLength = 8

module.exports.localLogin = [
  body('email')
    .isEmail().withMessage('Email is not valid')
    .trim().normalizeEmail({ remove_dots: false }),
  body('password')
    .isLength({ min: passwordMinLength })
    .withMessage(`Password must be at least ${passwordMinLength} characters long`),
  errorCheck
]

module.exports.localSignup = [
  body('firstName').exists().withMessage('FirstName is required'),
  body('lastName').exists().withMessage('LastName is required'),
  body('email')
    .isEmail().withMessage('Email is not valid')
    .trim().normalizeEmail({ remove_dots: false }),
  body('password')
    .isLength({ min: passwordMinLength }).withMessage(
      `Password must be at least ${passwordMinLength} characters long`
    ),
  errorCheck
]
