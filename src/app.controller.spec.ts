import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './app.module';
import request from 'supertest';

type HealthResponse = {
  status: string;
  check: string;
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('Probando controller', () => {
    it('Probando getHello"', () => {
      expect(appController.getHello()).not.toBe('Hola Mundo!');
    });
    it('Probando getHi"', () => {
      expect(appController.getHi()).toBeDefined();
    });
    it('Probando getLiveness"', () => {
      expect(appController.getLiveness()).toMatchObject({
        status: 'ok',
        check: 'live',
      });
    });
    it('Probando getReadiness"', () => {
      expect(appController.getReadiness()).toMatchObject({
        status: 'ok',
        check: 'ready',
      });
    });
  });
});

describe('AppController (Via Rest)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/GET', () => {
    return request(app.getHttpServer())
      .get('/hi')
      .expect(200)
      .expect('Hi there!!!');
  });

  it('/GET', () => {
    return request(app.getHttpServer())
      .get('/hello')
      .expect(200)
      .expect('Hello World!');
  });

  it('/GET health/live', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect((res) => {
        const body = res.body as HealthResponse;
        expect(body.status).toBe('ok');
        expect(body.check).toBe('live');
      });
  });

  it('/GET health/ready', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as HealthResponse;
        expect(body.status).toBe('ok');
        expect(body.check).toBe('ready');
      });
  });
});
