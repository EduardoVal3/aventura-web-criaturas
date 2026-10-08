import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ExcepcionesFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<Response>();

    let estado = HttpStatus.INTERNAL_SERVER_ERROR;
    let codigo = 'ERROR_INTERNO_SERVIDOR';
    let mensaje = 'Ocurrió un error inesperado en el servidor.';

    if (exception instanceof HttpException) {
      estado = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (resObj.codigo && resObj.mensaje) {
          codigo = resObj.codigo;
          mensaje = Array.isArray(resObj.mensaje)
            ? resObj.mensaje.join('; ')
            : resObj.mensaje;
        } else if (resObj.message) {
          codigo =
            estado === HttpStatus.BAD_REQUEST
              ? 'DATOS_INVALIDOS'
              : estado === HttpStatus.UNAUTHORIZED
              ? 'NO_AUTORIZADO'
              : estado === HttpStatus.CONFLICT
              ? 'CONFLICTO'
              : 'ERROR_PETICION';
          mensaje = Array.isArray(resObj.message)
            ? resObj.message.join('; ')
            : String(resObj.message);
        }
      } else if (typeof res === 'string') {
        mensaje = res;
      }
    }

    respuesta.status(estado).json({
      error: {
        codigo,
        mensaje,
      },
    });
  }
}
