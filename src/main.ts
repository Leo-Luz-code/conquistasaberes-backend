import { PrismaService } from './plugins/database/services/prisma.service';
import { LoggingService } from './shared/services/logging.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

import { LoggingInterceptor } from './common/interceptors';
import * as winElasticsearch from 'winston-elasticsearch';
import * as Elasticsearch from 'elasticsearch';
import * as cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { join } from 'path';

async function bootstrap() {
  const ssl = process.env.SSL === 'true';
  let httpsOptions = null;

  if (ssl) {
    const keyPath = readFileSync(__dirname + '/../../ssl/server.key');
    const certPath = readFileSync(__dirname + '/../../ssl/ssl-bundle.crt');
    httpsOptions = {
      key: keyPath,
      cert: certPath,
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const prismaService = app.get(PrismaService);
  const loggingService = new LoggingService(prismaService);

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalInterceptors(new LoggingInterceptor(loggingService));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const config = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AVA UniVC - Ambiente Virtual de Aprendizagem PMVC')
    .setDescription(
      'API Oficial do Ambiente Virtual de Aprendizagem da Prefeitura Municipal de Vitória da Conquista (CETI / SETP)',
    )
    .setVersion(config.get<string>('APP_VERSION') || '1.0.0')
    .addTag('Autenticação SSO')
    .addTag('Catálogo de Cursos & AVA')
    .addTag('Trilhas de Aprendizagem')
    .addTag('Gamificação & Ranking')
    .addTag('Certificados & Autenticidade')
    .addTag('Comunidades & Fórum')
    .addTag('Motor de Recomendação IA')
    .addTag('Analytics & Painel de Gestão')
    .addTag('Gestão de Servidores & Perfis')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const HTTP_PORT = config.get<string>('HTTP_PORT');
  const APP_NAME = config.get<string>('APP_NAME');
  const APP_HOSTNAME = config.get<string>('APP_HOSTNAME');
  const NODE_ENV = config.get<string>('NODE_ENV');
  const ELASTICSEARCH = config.get<string>('ELASTICSEARCH');
  const ELASTICSEARCH_ACTIVE = config.get<string>('ELASTICSEARCH_ACTIVE');

  if (ELASTICSEARCH_ACTIVE === 'true') {
    app.useLogger(
      // Overwrite nestjs logger
      WinstonModule.createLogger({
        transports: ((): any[] => {
          const transports = [
            // Winston
            new winston.transports.Console({
              level: 'debug',
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(
                  (info) => `${info.timestamp} ${info.level}: ${info.message}`,
                ),
              ),
            }),
            // Winston elasticsearch
            new winElasticsearch({
              indexPrefix: `logs-${APP_NAME}`,
              client: new Elasticsearch.Client({
                host: ELASTICSEARCH,
              }),
              level: 'debug',
              transformer: (logData: any) => {
                const transformed: any = {};
                transformed['@timestamp'] =
                  logData.timestamp ?? new Date().toISOString();
                transformed.message = logData.message;
                transformed.severity = logData.level;
                transformed.fields =
                  typeof logData.meta?.context === 'object'
                    ? { ...logData.meta.context }
                    : typeof logData.meta?.stack?.[0] === 'object'
                    ? { ...logData.meta?.stack?.[0] }
                    : { stack: logData.meta?.stack?.[0] };

                transformed.logId = transformed.fields.logId;
                delete transformed.fields.logId;

                return transformed;
              },
            }),
          ];

          if (NODE_ENV !== 'production') {
            return transports;
          }

          transports.splice(0, 1);

          return transports;
        })(),
      }),
    );
  }

  const appHost = APP_HOSTNAME || 'localhost';

  await app.listen(HTTP_PORT, '0.0.0.0', () => {
    const address =
      'http' + (ssl ? 's' : '') + '://' + appHost + ':' + HTTP_PORT + '/';
    Logger.log('🚀 Servidor rodando em ' + address);
  });
}

bootstrap();
