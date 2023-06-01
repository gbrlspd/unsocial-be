import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordTemplate {
  public resetTemplate(templateParams: IResetPasswordParams): string {
    const { username, email, ipaddress, date } = templateParams;
    return ejs.render(fs.readFileSync(__dirname + '/template.ejs', 'utf-8'), {
      username,
      email,
      ipaddress,
      date,
      image_url: 'https://cdn-icons-png.flaticon.com/256/1803/1803612.png',
    });
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();
