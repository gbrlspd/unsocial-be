import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { PostCache } from '@services/redis/post.cache';
import { socketPostObject } from '@socket/post';
import { postQueue } from '@services/queues/post.queue';

const postCache: PostCache = new PostCache();

export class DeletePost {
  public async delete(req: Request, res: Response): Promise<void> {
    socketPostObject.emit('delete post', req.params.postId);

    await postCache.deletePostFromCache(req.params.postId, `${req.currentUser!.userId}`);

    postQueue.addPostJob('deletePostFromDatabase', { keyOne: req.params.postId, keyTwo: req.currentUser!.userId });

    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully' });
  }
}
