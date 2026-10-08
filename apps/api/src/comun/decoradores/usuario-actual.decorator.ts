import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UsuarioActual = createParamDecorator(
  (campo: string | undefined, contexto: ExecutionContext) => {
    const peticion = contexto.switchToHttp().getRequest();
    const usuario = peticion.user;
    return campo ? usuario?.[campo] : usuario;
  },
);
