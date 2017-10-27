const express = require('express')
const router = express.Router()

const { jwtEnsure } = require('./utils/jwt')
const validate = require('./utils/validate')
const asyncMiddleware = require('./utils/asyncMiddleware')

const auth = require('./controllers/auth')
const curriculums = require('./controllers/curriculums')
const search = require('./controllers/search')
const supervisors = require('./controllers/supervisors')
const topics = require('./controllers/topics')
const users = require('./controllers/users')
const admin = require('./controllers/admin')

router.post('/auth/local/login', validate.localLogin, asyncMiddleware(auth.localLogin))
router.post('/auth/local/signup', validate.localSignup, asyncMiddleware(auth.localSignup))
router.post('/auth/logout', jwtEnsure, asyncMiddleware(auth.logout))

router.get('/curriculums/', asyncMiddleware(curriculums.getCurriculums))
router.get('/curriculums/:slug', asyncMiddleware(curriculums.getCurriculumBySlug))

router.get('/search/counts', asyncMiddleware(search.getCounts))

router.get('/supervisors/', asyncMiddleware(supervisors.getSupervisors))
router.get('/supervisors/:slug', asyncMiddleware(supervisors.getSupervisorBySlug))

router.get('/topics/', asyncMiddleware(topics.getTopics))

router.get('/users/me', jwtEnsure, asyncMiddleware(users.getUser))

// SAMPLE
router.get('/admin/', jwtEnsure, asyncMiddleware(admin.getSecret))

module.exports = router
