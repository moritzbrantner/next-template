export type SendEmailRequest = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  tags?: string[];
};

const DEFAULT_MAILPIT_BASE_URL = 'http://127.0.0.1:8025';

function getEmailProvider() {
  return process.env.EMAIL_PROVIDER?.toLowerCase() ?? 'console';
}

function getEmailFromAddress() {
  return process.env.EMAIL_FROM ?? 'no-reply@example.com';
}

function htmlToText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function sendEmail(request: SendEmailRequest): Promise<void> {
  const provider = getEmailProvider();
  const from = request.from ?? getEmailFromAddress();

  if (provider === 'console') {
    console.info('[email] simulated send', {
      from,
      to: request.to,
      subject: request.subject,
      html: request.html,
    });
    return;
  }

  if (provider === 'mailpit') {
    const response = await fetch(`${process.env.MAILPIT_BASE_URL ?? DEFAULT_MAILPIT_BASE_URL}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: {
          Email: from,
          Name: request.fromName,
        },
        To: [{ Email: request.to }],
        Subject: request.subject,
        HTML: request.html,
        Text: request.text ?? htmlToText(request.html),
        Tags: request.tags,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mailpit send failed with status ${response.status}.`);
    }

    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER "${provider}".`);
}
