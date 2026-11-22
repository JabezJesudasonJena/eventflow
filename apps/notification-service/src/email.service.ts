import {Injectable, OnModuleInit, Logger, ParseIntPipe } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor (){}
    
    async onModuleInit() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '1025', 10) ,
            secure: false, 
        })

        this.logger.log('Email service initialized');
    
    }

    async sendEmail(to: string, subject: string, html: string) : Promise<void> {
        try {
            await this.transporter.sendMail({
                from: '"EventFlowApp" <noreply@eventflowapp.com>',
                to,
                subject,
                html
            });
            this.logger.log(`Email sent to ${to} with subject "${subject}"`);
        }catch(err: any) {
            this.logger.error(`Error sending email to ${to}: ${err.message}`);
        }
    }
}