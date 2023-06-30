import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { CreatePost } from '@post/controllers/create-post';
import { GetPosts } from '@post/controllers/get-posts';
import { DeletePost } from '@post/controllers/delete-post';
import { UpdatePost } from '@post/controllers/update-post';

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/all/:page', authMiddleware.checkAuthentication, GetPosts.prototype.posts);
    this.router.get('/post/images/:page', authMiddleware.checkAuthentication, GetPosts.prototype.postsWithImages);

    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.create);
    this.router.post('/post/image/post', authMiddleware.checkAuthentication, CreatePost.prototype.createWithImage);

    this.router.put('/post/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.update);
    this.router.put('/post/image/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.updateWithImage);

    this.router.delete('/post/:postId', authMiddleware.checkAuthentication, DeletePost.prototype.delete);

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
