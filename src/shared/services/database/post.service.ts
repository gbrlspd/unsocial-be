import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { UpdateQuery } from 'mongoose';

class PostService {
  public async addPostData(userId: string, data: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(data);
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne(
      { _id: userId },
      {
        $inc: { postsCount: 1 },
      }
    );
    await Promise.all([post, user]);
  }
}

export const postService: PostService = new PostService();
