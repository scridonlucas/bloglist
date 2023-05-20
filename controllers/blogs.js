const blogsRouter = require('express').Router();
const Blog = require('../models/blogs');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const middleware = require('../utils/middleware');
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user');
  response.json(blogs);
});

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body;
  console.log(request.user);
  const decodedToken = jwt.verify(request.token, 'tokenpassword');

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user.id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  response.status(201).json(savedBlog);
});

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response) => {
    const blog = await Blog.findById(request.params.id);
    const decodedToken = jwt.verify(request.token, 'tokenpassword');

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }

    if (blog.user.toString() === decodedToken.id.toString()) {
      await Blog.findByIdAndRemove(request.params.id);
    }

    response.status(204).end();
  }
);

blogsRouter.put('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  const body = request.body;
  const decodedToken = jwt.verify(request.token, 'tokenpassword');

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    user: user.id,
  };

  if (blog.user.toString() === decodedToken.id.toString()) {
    const savedBlog = await Blog.findByIdAndUpdate(request.params.id, newBlog, {
      new: true,
    });
    response.status(201).json(savedBlog);
  }
});
module.exports = blogsRouter;
