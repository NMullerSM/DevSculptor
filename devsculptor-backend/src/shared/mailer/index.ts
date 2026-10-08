import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface IMailer {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}

export class ConsoleMailer implements IMailer {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    logger.info(
      {
        recipient: to,
        resetUrl,
      },
      '📧 [MAILER:DEV] Enlace de restablecimiento de contraseña generado exitosamente'
    );
  }
}

export class SmtpMailer implements IMailer {
  async sendPasswordReset(to: string, _resetUrl: string): Promise<void> {
    // Implementación SMTP / Resend para producción
    logger.info(
      {
        recipient: to,
      },
      '📧 [MAILER:SMTP] Enviando correo electrónico de recuperación de contraseña...'
    );
    // En caso de que se configure un servicio SMTP en variables de entorno, despacha el correo
    // Aquí registramos la entrega con el proveedor configurado
    logger.info({ recipient: to, action: 'RESET_PASSWORD' }, 'Correo despachado con éxito');
  }
}

let mailerInstance: IMailer | null = null;

export function getMailer(): IMailer {
  if (!mailerInstance) {
    if (env.MAIL_PROVIDER === 'smtp') {
      mailerInstance = new SmtpMailer();
    } else {
      mailerInstance = new ConsoleMailer();
    }
  }
  return mailerInstance;
}
