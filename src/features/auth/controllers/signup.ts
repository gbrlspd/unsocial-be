import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UploadApiResponse } from 'cloudinary';
import JWT from 'jsonwebtoken';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { signupSchema } from '@auth/schemes/signup';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { authService } from '@services/database/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { upload } from '@global/helpers/cloudinary-upload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@services/redis/user.cache';
import { config } from '@root/config';
import { authQueue } from '@services/queues/auth.queue';
import { userQueue } from '@services/queues/user.queue';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;

    const existingUser: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomInt(12)}`;

    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor,
    });

    const result: UploadApiResponse = (await upload(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError('File upload error');
    }

    /* add user to Redis cache */
    const userDataToCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataToCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataToCache);

    /* add to database */
    authQueue.addAuthUserJob('addAuthUserToDatabase', { value: authData });
    userQueue.addUserJob('addUserToDatabase', { value: userDataToCache });

    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);

    req.session = { jwt: userJwt };
    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', user: userDataToCache, token: userJwt });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
      },
      config.JWT_SECRET!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, uId, username, email, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date(),
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageId: '',
      bgImageVersion: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true,
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
      },
    } as unknown as IUserDocument;
  }
}
