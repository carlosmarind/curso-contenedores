import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { setImmediate } from 'node:timers/promises';
import { DataSource } from 'typeorm';
import { isDbEnabled } from './config/app.config';

@Injectable()
export class AppService {
  private readonly cpuTaskDurationMs = 10000;
  private readonly cpuTaskSliceMs = 50;
  private readonly memoryTaskMb = 100;
  private readonly memoryTaskDurationMs = 60000;

  constructor(private readonly moduleRef: ModuleRef) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHi(): string {
    return 'Hi there!!!';
  }

  /**
   * Ejecuta una carga intensiva de CPU durante ~10 segundos.
   *
   * Qué hace:
   * - Realiza operaciones matematicas en bloques cortos.
   * - Cede el event loop entre bloques para mantener vivos los healthchecks.
   * - Simula trabajo pesado del procesador para pruebas de rendimiento.
   *
   * Como se usa:
   * - Invoca el endpoint/controlador que llame este metodo.
   * - Util en pruebas de carga para observar consumo de CPU, latencia y estabilidad.
   */
  async runCpuTask(durationMs = this.cpuTaskDurationMs): Promise<string> {
    const start = Date.now();
    let count = 0;

    while (Date.now() - start < durationMs) {
      const sliceStart = Date.now();

      while (Date.now() - sliceStart < this.cpuTaskSliceMs) {
        count += Math.sqrt(Math.random() * Math.random());
      }

      await setImmediate();
    }

    return `Test de cpu terminado! Iteraciones: ${count}`;
  }

  /**
   * Reserva memoria en RAM mientras la solicitud esta abierta.
   *
   * Qué hace:
   * - Crea un Buffer fijo de 100 MB.
   * - Mantiene la solicitud abierta por 60 segundos.
   * - Si el cliente cierra la conexion antes, termina la espera.
   *
   * Como se usa:
   * - Cada conexion concurrente consume aproximadamente 100 MB.
   * - Al terminar la solicitud, la memoria queda disponible para el recolector.
   */
  async runMemoryTask(abortSignal?: AbortSignal): Promise<string> {
    let memoryBlock: Buffer | null = Buffer.alloc(
      this.memoryTaskMb * 1024 * 1024,
      1,
    );

    try {
      await this.waitForMemoryTask(abortSignal);
      const reservedBytes = memoryBlock.byteLength;
      void reservedBytes;
      return `Reservados ${this.memoryTaskMb} MB de memoria durante la solicitud.`;
    } finally {
      memoryBlock = null;
      void memoryBlock;
    }
  }

  private waitForMemoryTask(abortSignal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (abortSignal?.aborted) {
        resolve();
        return;
      }

      const timeout = setTimeout(resolve, this.memoryTaskDurationMs);

      const finish = () => {
        clearTimeout(timeout);
        abortSignal?.removeEventListener('abort', finish);
        resolve();
      };

      abortSignal?.addEventListener('abort', finish, { once: true });
    });
  }

  getLiveness() {
    return {
      status: 'ok',
      check: 'live',
      timestamp: new Date().toISOString(),
    };
  }

  getReadiness() {
    if (!isDbEnabled()) {
      return this.buildReadinessResponse('ok', false, 'skipped');
    }

    const dataSource = this.moduleRef.get(DataSource, { strict: false });

    if (!dataSource || !dataSource.isInitialized) {
      this.throwReadinessUnavailable();
    }

    return this.buildReadinessResponse('ok', true, 'up');
  }

  private buildReadinessResponse(
    status: 'ok' | 'error',
    dbEnabled: boolean,
    dbStatus: 'up' | 'down' | 'skipped',
  ) {
    return {
      status,
      check: 'ready',
      database: {
        enabled: dbEnabled,
        status: dbStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private throwReadinessUnavailable(): never {
    throw new ServiceUnavailableException(
      this.buildReadinessResponse('error', true, 'down'),
    );
  }
}
