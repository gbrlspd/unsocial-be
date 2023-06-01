import { Request, Response } from 'express';
import { config } from '@root/config';
import HTTP_STATUS from 'http-status-codes';
import moment from 'moment';
import publicIP from 'ip';
import { authService } from '@services/database/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import crypto from 'crypto';
import { forgotPasswordTemplate } from '@services/email/templates/forgot-password/template';
import { emailQueue } from '@services/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { resetPasswordTemplate } from '@services/email/templates/reset-password/template';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');

    /* token expires in 1 hour */
    await authService.updatePasswordToken(`${existingUser._id!}`, randomCharacters, Date.now() * 60 * 60 * 1000);

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.forgotTemplate(existingUser.username!, resetLink);

    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: email, subject: 'Reset your password' });

    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent' });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (password !== confirmPassword) {
      throw new BadRequestError('Password do not match');
    }

    const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Invalid token');
    }

    existingUser.password = password;
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetExpires = undefined;
    await existingUser.save();

    const templateParams: IResetPasswordParams = {
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: publicIP.address(),
      date: moment().format('YYYY/MM/DD HH:mm'),
    };

    const template: string = resetPasswordTemplate.resetTemplate(templateParams);

    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: existingUser.email!, subject: 'Password reset confirmation' });

    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated' });
  }
}
