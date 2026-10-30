import { z } from 'zod';
import { env } from './config/env.js';
import { createMailTransport } from './services/mail.js';

// With no recipient this checks DNS, TLS and authentication without sending mail.
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !z.email().safeParse(args[0]).success)) {
  console.error('Usage: npm run smtp:check -- [recipient@example.com]');
  process.exitCode = 1;
} else {
  try {
    const transport = createMailTransport();
    await transport.verify();
    console.log('SMTP connection, TLS and authentication verified.');
    if (args[0]) {
      const result = await transport.sendMail({
        from: env.SMTP_FROM,
        to: args[0],
        subject: 'LureLog email delivery test',
        text: 'This is a LureLog SMTP delivery test. No password reset was requested and this message contains no account credentials. If you can read it, the test reached your inbox.',
      });
      if (!result.accepted?.length || result.rejected?.length)
        throw new Error('RECIPIENT_REJECTED');
      console.log(
        'SMTP server accepted the test message. Confirm receipt in the inbox/spam folder; acceptance does not prove delivery.',
      );
    }
  } catch (error) {
    // Provider responses can contain addresses or credentials. Print only a known code.
    const code = (error as { code?: string }).code;
    const known = [
      'EAUTH',
      'ECONNECTION',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EDNS',
      'ESOCKET',
      'ETLS',
      'EENVELOPE',
      'EMESSAGE',
    ];
    console.error(
      `SMTP check failed${code && known.includes(code) ? ` (${code})` : ''}. Check SMTP configuration, sender verification and provider logs. Credentials were not printed.`,
    );
    process.exitCode = 1;
  }
}
