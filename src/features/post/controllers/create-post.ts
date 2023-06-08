import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@services/redis/post.cache';
import { socketPostObject } from '@socket/post';
import { postQueue } from '@services/queues/post.queue';
import { UploadApiResponse } from 'cloudinary';
import { upload } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';

const postCache: PostCache = new PostCache();

export class CreatePost {
  @joiValidation(postSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      createdAt: new Date(),
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    } as IPostDocument;

    socketPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost,
    });

    postQueue.addPostJob('addPostToDatabase', { key: req.currentUser!.userId, value: createdPost });

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Post created successfully',
    });
  }

  @joiValidation(postWithImageSchema)
  public async createWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;
    const postObjectId: ObjectId = new ObjectId();

    const result: UploadApiResponse = (await upload(image)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      createdAt: new Date(),
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    } as IPostDocument;

    socketPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost,
    });

    postQueue.addPostJob('addPostToDatabase', { key: req.currentUser!.userId, value: createdPost });

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Post with image created successfully',
    });
  }
}
