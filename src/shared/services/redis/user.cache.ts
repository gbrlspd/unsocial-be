import Logger from 'bunyan';
import { config } from '@root/config';
import { BaseCache } from '@services/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('redisConnection');

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(key: string, userUid: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social,
    } = createdUser;
    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`,
    ];
    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social),
    ];
    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`,
    ];
    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUid, 10), value: `${key}` });
      await this.client.HSET(`users:${key}`, dataToSave);
    } catch (error) {
      log.error(error);
      throw new ServerError('Internal error');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const res: IUserDocument = (await this.client.HGETALL(`users:${userId}`)) as unknown as IUserDocument;
      res.createdAt = new Date(Helpers.parseJson(`${res.createdAt}`));
      res.postsCount = Helpers.parseJson(`${res.postsCount}`);
      res.blocked = Helpers.parseJson(`${res.blocked}`);
      res.blockedBy = Helpers.parseJson(`${res.blockedBy}`);
      res.notifications = Helpers.parseJson(`${res.notifications}`);
      res.social = Helpers.parseJson(`${res.social}`);
      res.followersCount = Helpers.parseJson(`${res.followersCount}`);
      res.followingCount = Helpers.parseJson(`${res.followingCount}`);

      return res;
    } catch (error) {
      log.error(error);
      throw new ServerError('Internal error');
    }
  }
}
