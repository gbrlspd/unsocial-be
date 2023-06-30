import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { PostCache } from '@services/redis/post.cache';
import { socketPostObject } from '@socket/post';
import { postQueue } from '@services/queues/post.queue';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { UploadApiResponse } from 'cloudinary';
import { upload } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';

const postCache: PostCache = new PostCache();

export class UpdatePost {
  @joiValidation(postSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion,
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePostFromCache(postId, updatedPost);

    socketPostObject.emit('update post', postUpdated, 'posts');

    postQueue.addPostJob('updatePostFromDatabase', { key: postId, value: postUpdated });

    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async updateWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;
    if (imgId && imgVersion) {
      UpdatePost.prototype.updatePostWithImage(req);
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.updatePostWithNewImage(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePostFromCache(postId, updatedPost);

    socketPostObject.emit('update post', postUpdated, 'posts');

    postQueue.addPostJob('updatePostFromDatabase', { key: postId, value: postUpdated });
  }

  private async updatePostWithNewImage(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } = req.body;
    const { postId } = req.params;

    const result: UploadApiResponse = (await upload(image)) as UploadApiResponse;
    if (!result?.public_id) {
      return result;
    }

    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      profilePicture,
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePostFromCache(postId, updatedPost);

    socketPostObject.emit('update post', postUpdated, 'posts');

    postQueue.addPostJob('updatePostFromDatabase', { key: postId, value: postUpdated });

    return result;
  }
}
