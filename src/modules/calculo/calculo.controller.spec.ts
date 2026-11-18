import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CalculoModule } from './calculo.module';

describe('CalculoController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CalculoModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  test('GET /calculo deberia sumar correctamente', () => {
    return request(app.getHttpServer())
      .get('/calculo?operacion=suma&a=10&b=20')
      .expect(200)
      .expect({
        resultado: 30,
        mensaje: 'operacion exitosa',
      });
  });

  test('GET /calculo deberia dividir correctamente', () => {
    return request(app.getHttpServer())
      .get('/calculo?operacion=dividir&a=20&b=5')
      .expect(200)
      .expect({
        resultado: 4,
        mensaje: 'operacion exitosa',
      });
  });

  test('GET /calculo deberia responder 400 si la operacion es invalida', () => {
    return request(app.getHttpServer())
      .get('/calculo?operacion=modulo&a=10&b=20')
      .expect(400)
      .expect({
        resultado: null,
        mensaje:
          'operacion invalida. Valores permitidos: suma, resta, multiplicar, dividir',
      });
  });

  test('GET /calculo deberia responder 400 si se intenta dividir por cero', () => {
    return request(app.getHttpServer())
      .get('/calculo?operacion=dividir&a=10&b=0')
      .expect(400)
      .expect({
        resultado: null,
        mensaje: 'no se puede dividir por cero',
      });
  });
});
