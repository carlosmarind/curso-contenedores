import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('app.db.host', 'localhost'),
        port: configService.get<number>('app.db.port', 5432),
        username: configService.get<string>('app.db.username', 'postgres'),
        password: configService.get<string>('app.db.password', 'password'),
        database: configService.get<string>('app.db.database', 'nestjs_db'),
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error'],
      }),
    }),
  ],
})
export class DatabaseModule {}
