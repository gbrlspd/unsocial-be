import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public forgotTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/template.ejs', 'utf-8'), {
      username,
      resetLink,
      image_url: 'https://cdn-icons-png.flaticon.com/256/1803/1803612.png',
    });
  }
}

export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();
