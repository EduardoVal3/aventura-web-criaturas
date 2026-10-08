import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Label } from "@/components/ui/8bit/label";
import { Input } from "@/components/ui/8bit/input";
import { Button } from "@/components/ui/8bit/button";
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  esquemaRegistro,
  type DatosRegistro,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { ErrorApi } from "@/api";

export function PantallaRegistro() {
  const navigate = useNavigate();
  const { registrarUsuario } = useAutenticacion();
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      nombreUsuario: "",
      correo: "",
      clave: "",
    },
  });

  const onSubmit = async (valores: DatosRegistro) => {
    try {
      setEnviando(true);
      await registrarUsuario(valores);
      toast.success("¡Cuenta creada correctamente! Bienvenido a Aethelgard.");
      navigate("/crear-personaje");
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Ocurrió un error inesperado al registrar la cuenta.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8 px-2 sm:px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-xl sm:text-2xl text-primary">
              Registro de Explorador
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Crea tu cuenta de aventurero para explorar las tierras de Aethelgard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombreUsuario">Nombre de usuario</Label>
                <Input
                  id="nombreUsuario"
                  type="text"
                  placeholder="ej. arturo_sendas"
                  disabled={enviando}
                  aria-invalid={!!errors.nombreUsuario}
                  aria-describedby={errors.nombreUsuario ? "error-nombre-usuario" : undefined}
                  {...register("nombreUsuario")}
                />
                {errors.nombreUsuario && (
                  <p
                    id="error-nombre-usuario"
                    className="text-xs text-destructive font-medium"
                    role="alert"
                  >
                    {errors.nombreUsuario.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="explorador@ejemplo.com"
                  disabled={enviando}
                  aria-invalid={!!errors.correo}
                  aria-describedby={errors.correo ? "error-correo" : undefined}
                  {...register("correo")}
                />
                {errors.correo && (
                  <p
                    id="error-correo"
                    className="text-xs text-destructive font-medium"
                    role="alert"
                  >
                    {errors.correo.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clave">Contraseña</Label>
                <Input
                  id="clave"
                  type="password"
                  placeholder="Mín. 8 caracteres, número y símbolo"
                  disabled={enviando}
                  aria-invalid={!!errors.clave}
                  aria-describedby={errors.clave ? "error-clave" : undefined}
                  {...register("clave")}
                />
                {errors.clave && (
                  <p
                    id="error-clave"
                    className="text-xs text-destructive font-medium"
                    role="alert"
                  >
                    {errors.clave.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <span>Registrar cuenta</span>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground mt-2">
                ¿Ya posees una cuenta?{" "}
                <Link
                  to="/ingreso"
                  className="text-primary underline underline-offset-4 hover:opacity-80 font-medium"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default PantallaRegistro;
