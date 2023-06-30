/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@mocks/auth.mock';
import * as postServer from '@socket/post';
import { postMockData, postMockRequest, postMockResponse, updatedPost, updatedPostWithImage } from '@mocks/post.mock';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { UpdatePost } from '@post/controllers/update-post';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@global/helpers/cloudinary-upload');

Object.defineProperties(postServer, {
  socketPostObject: {
    value: new Server(),
    writable: true,
  },
});

describe('UpdatePost', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('update', () => {
    it('should send correct json response', async () => {
      const req: Request = postMockRequest(updatedPost, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostFromCache').mockResolvedValue(postMockData);
      jest.spyOn(postServer.socketPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePost.prototype.update(req, res);
      expect(postSpy).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostFromDatabase', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post updated successfully',
      });
    });
  });

  describe('updateWithImage', () => {
    it('should send correct json response if imgId and imgVersion exists', async () => {
      updatedPostWithImage.imgId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req: Request = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostFromCache');
      jest.spyOn(postServer.socketPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePost.prototype.updateWithImage(req, res);
      expect(PostCache.prototype.updatePostFromCache).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostFromDatabase', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully',
      });
    });

    it('should send correct json response if no imgId and imgVersion', async () => {
      updatedPostWithImage.imgId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req: Request = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostFromCache');
      jest.spyOn(cloudinaryUploads, 'upload').mockImplementation((): any => Promise.resolve({ version: '1234', public_id: '123456' }));
      jest.spyOn(postServer.socketPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePost.prototype.updateWithImage(req, res);
      expect(PostCache.prototype.updatePostFromCache).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostFromDatabase', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully',
      });
    });
  });
});
