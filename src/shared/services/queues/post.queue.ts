import { BaseQueue } from './base.queue';
import { IPostJob } from '@post/interfaces/post.interface';
import { postWorker } from '@workers/post.worker';

class PostQueue extends BaseQueue {
  constructor() {
    super('post');
    this.processJob('addPostToDatabase', 5, postWorker.addPostToDatabase);
  }

  public addPostJob(name: string, data: IPostJob): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
