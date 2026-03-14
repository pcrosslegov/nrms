import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = config.get('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get('SMTP_PORT', 587),
        secure: config.get('SMTP_SECURE', 'false') === 'true',
        auth: config.get('SMTP_USER')
          ? {
              user: config.get('SMTP_USER'),
              pass: config.get('SMTP_PASS'),
            }
          : undefined,
      });
    }
  }

  get isConfigured(): boolean {
    return !!this.transporter;
  }

  async send(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename: string; content: Buffer; contentType: string }[];
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('SMTP not configured — email not sent');
      this.logger.debug(`Would send to: ${options.to}, subject: ${options.subject}`);
      return;
    }

    const from = this.config.get('SMTP_FROM', 'nrms@gov.nb.ca');

    await this.transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    this.logger.log(`Email sent: ${options.subject}`);
  }
}
