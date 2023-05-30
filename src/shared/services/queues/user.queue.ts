import { BaseQueue } from './base.queue';
import { userWorker } from '@workers/user.worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('user');
    this.processJob('addUserToDatabase', 5, userWorker.addUserToDatabase);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addUserJob(name: string, data: any): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
