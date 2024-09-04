const jwt = require('jsonwebtoken')
const { SECRET } = require('../util/config')

const router = require('express').Router()

const { Blog, User } = require('../models')

const blogFinder = async (req, res, next) => {
  const blog = await Blog.findByPk(req.params.id)
  if (!blog) {
    return res.status(404).json({ error: 'Blog not found' })
  }
  req.blog = blog
  next()
}


const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    try {
      req.decodedToken = jwt.verify(authorization.substring(7), SECRET)
    } catch (error) {
      console.log(error)
    }
  }
  next()
}
const authChecker = async (req, res, next) => {
  if (!req.decodedToken) {
    return res.status(401).json({ error: 'Token missing or invalid' })
  }

  const user = await User.findByPk(req.decodedToken.id)
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  req.user = user
  next()
}


router.get('/', async (req, res) => {
  const blogs = await Blog.findAll()
  res.json(blogs)
})

router.post('/', tokenExtractor, authChecker, async (req, res) => {
  const blog = await Blog.create({ ...req.body, userId: req.user.id })
  res.json(blog)
})

router.put('/:id', blogFinder, async (req, res) => {
  if (!req.body.likes) {
    return res.status(400).json({ error: 'Likes field is required' })
  }
  req.blog.likes = req.body.likes
  const updatedBlog = await req.blog.save()
  res.json(updatedBlog)
})

router.delete('/:id', blogFinder, tokenExtractor, authChecker, async (req, res) => {
  if (req.blog.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' })
  }
  await req.blog.destroy()
  res.status(204).end()
})

module.exports = router
