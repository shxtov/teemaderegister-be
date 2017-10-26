const express = require('express')
const router = express.Router()

const { jwtEnsure, jwtCheck } = require('./utils/jwt')
const v = require('./utils/validate')
const asyncMiddleware = require('./utils/asyncMiddleware')

const auth = require('./controllers/auth')
const curriculums = require('./controllers/curriculums')
const search = require('./controllers/search')
const supervisors = require('./controllers/supervisors')
const topics = require('./controllers/topics')
const users = require('./controllers/users')

router.post('/auth/local/login', jwtCheck, v.localLogin, asyncMiddleware(auth.localLogin))
router.post('/auth/local/signup', jwtCheck, v.localSignup, asyncMiddleware(auth.localSignup))
router.post('/auth/logout', jwtEnsure, asyncMiddleware(auth.logout))

router.get('/curriculums/', jwtCheck, asyncMiddleware(curriculums.getCurriculums))
router.get('/curriculums/:slug', jwtCheck, asyncMiddleware(curriculums.getCurriculumBySlug))

router.get('/search/counts', jwtCheck, asyncMiddleware(search.getCounts))

router.get('/supervisors/', jwtCheck, asyncMiddleware(supervisors.getSupervisors))
router.get('/supervisors/:slug', jwtCheck, asyncMiddleware(supervisors.getSupervisorBySlug))

router.get('/topics/', jwtCheck, asyncMiddleware(topics.getTopics))

router.get('/users/me', jwtEnsure, asyncMiddleware(users.getUser))

module.exports = router
