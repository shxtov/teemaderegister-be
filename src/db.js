const mongoose = require('mongoose')
const Promise = require('bluebird')
require('dotenv').config()

mongoose.Promise = Promise
module.exports = mongoose.connect(process.env.MONGODB_URI, { useMongoClient: true })
