import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles,
  Mail,
  Lock,
  ShieldCheck,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

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
    <div className="relative min-h-[calc(100vh-10rem)] w-full flex flex-col items-center justify-center py-6 sm:py-10 px-2 sm:px-4 overflow-x-hidden">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <Card className="w-full rounded-none border-4 border-black shadow-[6px_6px_0_0_#000] bg-card/95 backdrop-blur-xs">
          <CardHeader className="text-center space-y-2 pb-4 pt-6 px-4 sm:px-6">
            {/* Insignia temática retro-brutalist sin emojis unicode (Regla R1) */}
            <div className="flex justify-center mb-1">
              <Badge
                variant="outline"
                className="retro text-[9px] sm:text-[10px] tracking-wider text-primary border-2 border-black shadow-[2px_2px_0_0_#000] bg-primary/15 px-3 py-1 rounded-none inline-flex items-center gap-1.5"
              >
                <Sparkles className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                <span>RETORNO AL REINO</span>
              </Badge>
            </div>

            <CardTitle className="retro text-sm sm:text-base md:text-lg text-primary tracking-wide leading-relaxed">
              Portal de Ingreso
            </CardTitle>

            <CardDescription className="retro text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Introduce tus credenciales de aventurero para cruzar el umbral y reanudar tu travesía en Aethelgard.
            </CardDescription>

            {/* Separador ornamental retro pixelado de alto contraste */}
            <div
              className="w-full h-1 bg-gradient-to-r from-transparent via-black to-transparent dark:via-primary/50 mt-2"
              aria-hidden="true"
            />
          </CardHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={enviando}
          >
            <CardContent className="space-y-4 sm:space-y-5 pt-1 px-4 sm:px-6">
              {/* Campo Correo Electrónico con estética retro-brutalist 8bitcn */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="correo"
                  className="retro text-[9px] sm:text-[10px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Mail className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                  <span>Correo electrónico</span>
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="explorador@ejemplo.com"
                  autoComplete="email"
                  disabled={enviando}
                  className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 px-3 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-background/80 focus:shadow-[3px_3px_0_0_#000] focus:border-primary transition-colors tracking-wide"
                  aria-invalid={!!errors.correo}
                  aria-describedby={errors.correo ? "error-correo" : undefined}
                  {...register("correo")}
                />
                {errors.correo && (
                  <div
                    id="error-correo"
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-1"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.correo.message}</span>
                  </div>
                )}
              </div>

              {/* Campo Contraseña con Visibilidad Alternable y estética retro-brutalist 8bitcn */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="clave"
                    className="retro text-[9px] sm:text-[10px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Lock className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                    <span>Contraseña</span>
                  </Label>
                  <span className="retro text-[9px] sm:text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                    Llave secreta
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="clave"
                    type={mostrarClave ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={enviando}
                    className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 pl-3 pr-10 sm:pr-12 rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] bg-background/80 focus:shadow-[3px_3px_0_0_#000] focus:border-primary transition-colors tracking-wide"
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
                    className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:text-primary focus-visible:outline-hidden disabled:opacity-40 transition-colors cursor-pointer"
                    aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarClave ? (
                      <EyeOff className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.clave && (
                  <div
                    id="error-clave"
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-1"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.clave.message}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6 px-4 sm:px-6">
              {/* Botón de envío con prevención de doble clic, ergonomía táctil y estado de carga */}
              <div className="w-full pt-2 sm:pt-3">
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 h-12 sm:h-14 rounded-none border-4 border-black shadow-[4px_4px_0_0_#000] bg-primary text-primary-foreground active:translate-y-0.5 active:shadow-[2px_2px_0_0_#000] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={enviando}
                  aria-busy={enviando}
                >
                  {enviando ? (
                    <>
                      <Spinner className="size-4 shrink-0 text-primary-foreground" />
                      <span className="retro text-[10px] sm:text-xs tracking-wider">INICIANDO SESIÓN...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4 shrink-0 text-primary-foreground" aria-hidden="true" />
                      <span className="retro text-[10px] sm:text-xs tracking-wider">INICIAR SESIÓN</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Enlaces secundarios de navegación protegidos contra clics durante envío con disposición adaptativa móvil */}
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-between w-full pt-3 sm:pt-4 border-t border-black/40 gap-3 sm:gap-4 text-center sm:text-left",
                  enviando && "pointer-events-none opacity-50"
                )}
              >
                <Link
                  to="/registro"
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="retro text-[9px] sm:text-[10px] text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  ¿No tienes cuenta? Regístrate
                </Link>
                <Link
                  to="/creditos"
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="retro text-[9px] sm:text-[10px] hover:text-foreground text-muted-foreground transition-colors underline underline-offset-2"
                >
                  Ver créditos
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Nota de pie evocativa del universo de Aethelgard */}
        <div className="retro mt-4 flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] text-muted-foreground/75 select-none tracking-wide text-center">
          <ShieldCheck className="size-3.5 text-primary/75 shrink-0" aria-hidden="true" />
          <span>Conexión asegurada con el Reino de Aethelgard</span>
        </div>
      </div>
    </div>
  );
}

export default PantallaIngreso;
