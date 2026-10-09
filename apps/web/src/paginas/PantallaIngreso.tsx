import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

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
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  esquemaLogin,
  type DatosLogin,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { ErrorApi } from "@/api";
import { reproducirSonido } from "@/lib/assets";

export function PantallaIngreso() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAutenticacion();
  const [enviando, setEnviando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

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
    mode: "onTouched",
  });

  const onSubmit = async (valores: DatosLogin) => {
    if (enviando) return;
    try {
      setEnviando(true);
      reproducirSonido("click", 0.4);
      const respuesta = await iniciarSesion(valores);
      reproducirSonido("confirmar", 0.5);
      toast.success("¡Sesión iniciada con éxito! Bienvenido de vuelta a Aethelgard.");
      if (respuesta.tienePersonaje) {
        navigate("/hub");
      } else {
        navigate("/crear-personaje");
      }
    } catch (error) {
      reproducirSonido("error", 0.5);
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
        <Card className="shadow-2xl border-4">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="flex justify-center mb-1">
              <Badge
                variant="outline"
                className="retro text-[10px] tracking-wider text-primary border-primary bg-primary/10 px-2 py-0.5"
              >
                🔮 RETORNO AL REINO
              </Badge>
            </div>
            <CardTitle className="retro text-base sm:text-lg text-primary tracking-wide leading-relaxed">
              Portal de Ingreso
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-normal max-w-xs mx-auto">
              Accede a tu cuenta para continuar tu travesía y gestionar tus criaturas en Aethelgard.
            </CardDescription>
          </CardHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={enviando}
          >
            <CardContent className="space-y-4 pt-2">
              {/* Campo Correo Electrónico */}
              <div className="space-y-1.5">
                <Label htmlFor="correo" className="text-xs font-semibold text-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="explorador@ejemplo.com"
                  autoComplete="email"
                  disabled={enviando}
                  aria-invalid={!!errors.correo}
                  aria-describedby={errors.correo ? "error-correo" : undefined}
                  {...register("correo")}
                />
                {errors.correo && (
                  <div
                    id="error-correo"
                    className="flex items-center gap-1.5 text-xs text-destructive font-medium pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.correo.message}</span>
                  </div>
                )}
              </div>

              {/* Campo Contraseña con Visibilidad Alternable */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clave" className="text-xs font-semibold text-foreground">
                    Contraseña
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="clave"
                    type={mostrarClave ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={enviando}
                    className="pr-12"
                    aria-invalid={!!errors.clave}
                    aria-describedby={errors.clave ? "error-clave" : undefined}
                    {...register("clave")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      reproducirSonido("click", 0.3);
                      setMostrarClave((prev) => !prev);
                    }}
                    disabled={enviando}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-hidden transition-colors"
                    aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarClave ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.clave && (
                  <div
                    id="error-clave"
                    className="flex items-center gap-1.5 text-xs text-destructive font-medium pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.clave.message}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-3">
              {/* Botón de envío con prevención de doble clic y estado de carga */}
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={enviando}
                aria-busy={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4" />
                    <span className="retro text-xs">INICIANDO SESIÓN...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" aria-hidden="true" />
                    <span className="retro text-xs">INICIAR SESIÓN</span>
                  </>
                )}
              </Button>

              {/* Enlaces secundarios de navegación */}
              <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs text-muted-foreground gap-2 pt-2 border-t border-border/80">
                <Link
                  to="/registro"
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="text-primary underline underline-offset-4 hover:opacity-80 font-medium"
                >
                  ¿No tienes cuenta? Regístrate
                </Link>
                <Link
                  to="/creditos"
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="hover:text-foreground transition-colors underline underline-offset-2 text-[11px]"
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
