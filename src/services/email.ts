export class SimpleEmailService implements EmailService {
  async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    console.log(`Password Reset Email Sent to ${email}`);
    console.log(`Reset URL: http://localhost:3000/reset-password/${token}`);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`Welcome Email Sent to ${email}`);
    console.log(`Dear ${name}, welcome to Garden Agent!`);
  }
}

export const createEmailService = (): EmailService => {
  return new SimpleEmailService();
};