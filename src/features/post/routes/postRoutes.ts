import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { CreatePost } from '@post/controllers/create-post';

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.create);
    this.router.post('/post/image/post', authMiddleware.checkAuthentication, CreatePost.prototype.createWithImage);

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
