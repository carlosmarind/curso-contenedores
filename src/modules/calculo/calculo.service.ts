import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculoService {
  operar(operacion: string = '', a: number, b: number) {
    if (operacion === 'suma') {
      return this.#suma(a, b);
    } else if (operacion === 'resta') {
      return this.#resta(a, b);
    } else if (operacion === 'multiplicar') {
      return this.#multiplicar(a, b);
    } else if (operacion === 'dividir') {
      return this.#dividir(a, b);
    }
    throw new Error(
      'operacion invalida. Valores permitidos: suma, resta, multiplicar, dividir',
    );
  }
  #suma(a: number, b: number) {
    return a + b;
  }

  #resta(a: number, b: number) {
    return a - b;
  }

  #multiplicar(a: number, b: number) {
    return a * b;
  }

  #dividir(a: number, b: number) {
    if (b === 0) {
      throw new Error('no se puede dividir por cero');
    }
    return a / b;
  }
}
