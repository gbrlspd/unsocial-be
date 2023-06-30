import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@services/redis/post.cache';
import { postService } from '@services/database/post.service';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10;

export class GetPosts {
  public async posts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const cacheSkip: number = skip === 0 ? skip : skip + 1;

    let posts: IPostDocument[] = [];
    let totalPosts = 0;

    const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache('post', cacheSkip, limit);
    if (cachedPosts.length) {
      posts = cachedPosts;
      totalPosts = await postCache.getTotalPostsFromCache();
    } else {
      posts = await postService.getPosts({}, skip, limit, { createdAt: -1 });
      totalPosts = await postService.postsCount();
    }

    res.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPosts });
  }

  public async postsWithImages(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const cacheSkip: number = skip === 0 ? skip : skip + 1;

    let posts: IPostDocument[] = [];

    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', cacheSkip, limit);

    posts = cachedPosts.length ? cachedPosts : await postService.getPosts({ imgId: '$ne', gifUrl: '$ne' }, skip, limit, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts });
  }
}
