import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de saludo basico.
   * HTTP: GET /hello
   * Ejemplo: curl http://localhost:3000/hello
   */
  @Get('/hello')
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint de saludo alternativo.
   * HTTP: GET /hi
   * Ejemplo: curl http://localhost:3000/hi
   */
  @Get('/hi')
  getHi(): string {
    return this.appService.getHi();
  }

    /**
   * Endpoint de lectura de variables de ambiente
   * HTTP: GET /environment
   * Ejemplo: curl http://localhost:3000/environment
   */
  @Get('/environment')
  getEnvironment(): string {
    return this.appService.getEnvironment();
  }

  /**
   * Endpoint para prueba de carga de CPU.
   * HTTP: GET /cpu
   * Ejemplo: curl http://localhost:3000/cpu
   */
  @Get('cpu')
  getCpuTest(): Promise<string> {
    return this.appService.runCpuTask();
  }

  /**
   * Endpoint para prueba de consumo de memoria por conexion.
   * HTTP: GET /memory
   * Ejemplos:
   * - curl http://localhost:3000/memory
   *
   * Cada conexion reserva 100 MB durante 60 segundos.
   * Si el cliente cierra la conexion antes, la reserva termina.
   */
  @Get('memory')
  getMemoryTest(@Res({ passthrough: true }) response: Response) {
    const abortController = new AbortController();

    response.on('close', () => {
      abortController.abort();
    });

    return this.appService.runMemoryTask(abortController.signal);
  }

  /**
   * Endpoint de liveness para saber si la app esta viva.
   * HTTP: GET /health/live
   */
  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  /**
   * Endpoint de readiness para saber si la app esta lista para recibir trafico.
   * HTTP: GET /health/ready
   */
  @Get('health/ready')
  getReadiness() {
    return this.appService.getReadiness();
  }
}
