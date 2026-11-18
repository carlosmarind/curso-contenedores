import { ServiceUnavailableException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService({} as ModuleRef);
  });

  describe('getReadiness', () => {
    const query = jest.fn();
    const dataSource = { isInitialized: true, query };
    const moduleRef = { get: jest.fn(() => dataSource) };
    const originalEnableDb = process.env.ENABLE_DB;

    beforeEach(() => {
      process.env.ENABLE_DB = 'true';
      dataSource.isInitialized = true;
      query.mockReset().mockResolvedValue([{ '?column?': 1 }]);
      moduleRef.get.mockClear();
      service = new AppService(moduleRef as unknown as ModuleRef);
    });

    afterEach(() => {
      if (originalEnableDb === undefined) delete process.env.ENABLE_DB;
      else process.env.ENABLE_DB = originalEnableDb;
      jest.useRealTimers();
    });

    it('omite PostgreSQL cuando esta deshabilitado', async () => {
      process.env.ENABLE_DB = 'false';
      expect(await service.getReadiness()).toMatchObject({
        database: { enabled: false, status: 'skipped' },
      });
      expect(moduleRef.get).not.toHaveBeenCalled();
    });

    it('comprueba PostgreSQL con una consulta antes de declararlo disponible', async () => {
      expect(await service.getReadiness()).toMatchObject({
        database: { enabled: true, status: 'up' },
      });
      expect(query).toHaveBeenCalledWith('SELECT 1');
    });

    it('devuelve 503 si PostgreSQL cae despues del arranque', async () => {
      query.mockRejectedValue(new Error('conexion cerrada'));
      await expect(async () => service.getReadiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('devuelve 503 si la conexion aun no se inicializo', async () => {
      dataSource.isInitialized = false;
      await expect(async () => service.getReadiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(query).not.toHaveBeenCalled();
    });

    it('devuelve 503 si una consulta no responde en dos segundos', async () => {
      jest.useFakeTimers();
      query.mockImplementation(() => new Promise(() => {}));
      const result = expect(async () =>
        service.getReadiness(),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      await jest.advanceTimersByTimeAsync(2000);
      await result;
    });
  });

  describe('runCpuTask', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('devuelve una promesa para ceder el event loop durante la carga de CPU', async () => {
      let now = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => now++);

      const task = service.runCpuTask(100);

      expect(task).toBeInstanceOf(Promise);
      await expect(task).resolves.toContain('Test de cpu terminado!');
    });
  });

  describe('runMemoryTask', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('reserva 100 MB mientras la solicitud esta abierta', async () => {
      const fakeBuffer = Buffer.from([1]);
      const allocSpy = jest.spyOn(Buffer, 'alloc').mockReturnValue(fakeBuffer);

      const task = service.runMemoryTask();
      let finished = false;
      void task.then(() => {
        finished = true;
      });

      expect(allocSpy).toHaveBeenCalledWith(100 * 1024 * 1024, 1);

      await jest.advanceTimersByTimeAsync(59999);
      expect(finished).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await expect(task).resolves.toBe(
        'Reservados 100 MB de memoria durante la solicitud.',
      );
      expect(finished).toBe(true);
    });

    it('libera la solicitud si el cliente cierra la conexion', async () => {
      jest.spyOn(Buffer, 'alloc').mockReturnValue(Buffer.from([1]));
      const controller = new AbortController();

      const task = service.runMemoryTask(controller.signal);

      controller.abort();

      await expect(task).resolves.toBe(
        'Reservados 100 MB de memoria durante la solicitud.',
      );
    });
  });
});
