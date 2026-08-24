import { ModuleRef } from '@nestjs/core';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService({} as ModuleRef);
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
