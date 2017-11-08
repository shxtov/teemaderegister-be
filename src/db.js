require('dotenv').config()

const { MONGOOSE_DEBUG, MONGODB_URI: uri } = process.env
const mongoose = require('mongoose')
const Promise = require('bluebird')

mongoose.Promise = Promise

MONGOOSE_DEBUG === 'true' && mongoose.set('debug', true)

module.exports = mongoose.connect(uri, { useMongoClient: true })
