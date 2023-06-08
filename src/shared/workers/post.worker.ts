import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { postService } from '@services/database/post.service';

const log: Logger = config.createLogger('postWorker');

class PostWorker {
  async addPostToDatabase(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.addPostData(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const postWorker: PostWorker = new PostWorker();
