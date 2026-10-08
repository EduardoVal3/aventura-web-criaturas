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
  esquemaLogin,
  type DatosLogin,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { ErrorApi } from "@/api";

export function PantallaIngreso() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAutenticacion();
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      correo: "",
      clave: "",
    },
  });

  const onSubmit = async (valores: DatosLogin) => {
    try {
      setEnviando(true);
      const respuesta = await iniciarSesion(valores);
      toast.success("¡Sesión iniciada con éxito!");
      if (respuesta.tienePersonaje) {
        navigate("/hub");
      } else {
        navigate("/crear-personaje");
      }
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Error al iniciar sesión. Verifica tus credenciales.");
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
              Portal de Ingreso
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Ingresa a tu cuenta para continuar tu travesía en Aethelgard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4 pt-2">
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
                  placeholder="Ingresa tu contraseña"
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
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs text-muted-foreground gap-2 pt-2 border-t border-border">
                <Link
                  to="/registro"
                  className="text-primary underline underline-offset-4 hover:opacity-80 font-medium"
                >
                  ¿No tienes cuenta? Regístrate
                </Link>
                <Link
                  to="/creditos"
                  className="hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Ver créditos
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default PantallaIngreso;
