const express = require('express')
const router = express.Router()

const ensureLoggedIn = require('./utils/ensureLoggedIn')

const auth = require('./controllers/auth')
const curriculums = require('./controllers/curriculums')
const search = require('./controllers/search')
const supervisors = require('./controllers/supervisors')
const topics = require('./controllers/topics')
const users = require('./controllers/users')

router.post('/auth/local/login', auth.localLogin)
router.post('/auth/local/signup', auth.localSignup)
router.post('/auth/logout', ensureLoggedIn, auth.logout)

router.get('/curriculums/', curriculums.getCurriculums)
router.get('/curriculums/:slug', curriculums.getCurriculumBySlug)

router.get('/search/counts', search.getCounts)

router.get('/supervisors/', supervisors.getSupervisors)
router.get('/supervisors/:slug', supervisors.getSupervisorBySlug)

router.get('/topics/', topics.getTopics)

router.get('/users/me', ensureLoggedIn, users.getUser)

module.exports = router
