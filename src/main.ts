import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  await app.listen(port);
  const logger = new Logger('bootstrap');
  logger.log(`Listening on ${await app.getUrl()}`);
}
bootstrap().catch((e) => console.log(`Error al iniciar la aplicacion: ${e}`));
