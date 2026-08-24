import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CalculoModule } from './modules/calculo/calculo.module';
import { UsersDataModule } from './modules/users-data/users-data.module';
import appConfig, { isDbEnabled } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    CalculoModule,
    ...(isDbEnabled() ? [UsersDataModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
