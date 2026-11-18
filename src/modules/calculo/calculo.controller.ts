import { Controller, Get, Query, Res } from '@nestjs/common';
import { CalculoService } from './calculo.service';
import { type Response } from 'express';

@Controller('calculo') // <- localhost:3000/calculo
export class CalculoController {
  constructor(private readonly calculoService: CalculoService) {}

  @Get() // <- GET http://localhost:puerto/calculo o http://localhost:3000/calculo?operacion=resta&a=55&b=35
  operar(
    @Res() res: Response,
    @Query('operacion') operacion: string, // ?operacion=
    @Query('a') a: number, // & a=
    @Query('b') b: number, // & b=
  ) {
    try {
      const calculo = this.calculoService.operar(operacion, +a, +b);

      return res
        .status(200)
        .json({ resultado: calculo, mensaje: 'operacion exitosa' });
    } catch (error) {
      return res.status(400).json({
        resultado: null,
        mensaje:
          error instanceof Error
            ? error.message
            : 'operacion no pudo ser calculada',
      });
    }
  }
}
