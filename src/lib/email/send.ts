import { Resend } from 'resend';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { UpgradeEmail } from './templates/UpgradeEmail';
import { PaymentFailedEmail } from './templates/PaymentFailedEmail';
import { CancellationEmail } from './templates/CancellationEmail';
import { brand } from './brand';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${brand.name} <${brand.email}>`;

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ${brand.name}`,
    react: WelcomeEmail({ name }),
  });
}

export async function sendUpgradeEmail(email: string, name: string, plan: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your ${plan} plan is now active!`,
    react: UpgradeEmail({ name, plan }),
  });
}

export async function sendPaymentFailedEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Payment issue on your subscription`,
    react: PaymentFailedEmail({ name }),
  });
}

export async function sendCancellationEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your subscription has been canceled`,
    react: CancellationEmail({ name }),
  });
}
