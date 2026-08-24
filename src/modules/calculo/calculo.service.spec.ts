import { Test, TestingModule } from '@nestjs/testing';
import { CalculoService } from './calculo.service';

describe('CalculoService', () => {
  let service: CalculoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculoService],
    }).compile();

    service = module.get<CalculoService>(CalculoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('operacion deberia sumar', () => {
    expect(service.operar('suma', 10, 50)).toBe(60);

    let a = 10;
    let b = 30;

    expect(service.operar('suma', a, b)).not.toBe(41);

    a = -100;
    b = 10;

    expect(service.operar('suma', a, b)).toBe(-90);
  });

  test('operacion deberia restar', () => {
    expect(service.operar('resta', 10, 50)).toBe(-40);

    let a = 10;
    let b = 30;

    expect(service.operar('resta', a, b)).not.toBe(20);

    a = -100;
    b = 10;

    expect(service.operar('resta', a, b)).toBe(-110);
  });

  test('operacion deberia multiplicar', () => {
    expect(service.operar('multiplicar', 10, 5)).toBe(50);
    expect(service.operar('multiplicar', -2, 4)).toBe(-8);
  });

  test('operacion deberia dividir', () => {
    expect(service.operar('dividir', 20, 5)).toBe(4);
    expect(service.operar('dividir', 9, 2)).toBe(4.5);
  });

  test('deberia lanzar excepcion si la operacion no existe', () => {
    expect(() => service.operar('modulo', 10, 3)).toThrow(
      'operacion invalida. Valores permitidos: suma, resta, multiplicar, dividir',
    );
  });

  test('deberia lanzar excepcion al dividir por cero', () => {
    expect(() => service.operar('dividir', 10, 0)).toThrow(
      'no se puede dividir por cero',
    );
  });
});

describe('CalculoService Unit (solo Jest)', () => {
  let service: CalculoService;

  beforeEach(() => {
    service = new CalculoService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('deberia sumar correctamente', () => {
    expect(service.operar('suma', 8, 12)).toBe(20);
    expect(service.operar('suma', -5, 2)).toBe(-3);
    expect(service.operar('suma', 0, 0)).toBe(0);
  });

  test('deberia restar correctamente', () => {
    expect(service.operar('resta', 20, 5)).toBe(15);
    expect(service.operar('resta', 5, 20)).toBe(-15);
    expect(service.operar('resta', 0, 0)).toBe(0);
  });

  test('deberia multiplicar correctamente', () => {
    expect(service.operar('multiplicar', 6, 7)).toBe(42);
    expect(service.operar('multiplicar', -3, 4)).toBe(-12);
    expect(service.operar('multiplicar', 100, 0)).toBe(0);
  });

  test('deberia dividir correctamente', () => {
    expect(service.operar('dividir', 16, 4)).toBe(4);
    expect(service.operar('dividir', 7, 2)).toBe(3.5);
    expect(service.operar('dividir', 0, 5)).toBe(0);
  });

  test('deberia ser determinista para la misma entrada', () => {
    const primerResultado = service.operar('multiplicar', 3, 9);
    const segundoResultado = service.operar('multiplicar', 3, 9);

    expect(primerResultado).toBe(segundoResultado);
  });

  test('deberia lanzar error para operaciones no soportadas', () => {
    expect(() => service.operar('potencia', 2, 3)).toThrow(
      'operacion invalida. Valores permitidos: suma, resta, multiplicar, dividir',
    );
  });

  test('deberia lanzar error si intenta dividir por cero', () => {
    expect(() => service.operar('dividir', 25, 0)).toThrow(
      'no se puede dividir por cero',
    );
  });
});
