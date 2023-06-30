import { BaseQueue } from './base.queue';
import { IPostJob } from '@post/interfaces/post.interface';
import { postWorker } from '@workers/post.worker';

class PostQueue extends BaseQueue {
  constructor() {
    super('post');
    this.processJob('addPostToDatabase', 5, postWorker.addPostToDatabase);
    this.processJob('deletePostFromDatabase', 5, postWorker.deletePostFromDatabase);
    this.processJob('updatePostFromDatabase', 5, postWorker.updatePostFromDatabase);
  }

  public addPostJob(name: string, data: IPostJob): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
