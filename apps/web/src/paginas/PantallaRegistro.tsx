import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

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
  esquemaRegistro,
  type DatosRegistro,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { ErrorApi } from "@/api";
import { reproducirSonido } from "@/lib/assets";

export function PantallaRegistro() {
  const navigate = useNavigate();
  const { registrarUsuario } = useAutenticacion();
  const [enviando, setEnviando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      nombreUsuario: "",
      correo: "",
      clave: "",
    },
    mode: "onTouched",
  });

  const claveActual = useWatch({ control, name: "clave" }) || "";
  const cumpleLargoMinimo = claveActual.length >= 8;
  const cumpleNumero = /\d/.test(claveActual);
  const cumpleSimbolo = /[^a-zA-Z0-9]/.test(claveActual);

  const onSubmit = async (valores: DatosRegistro) => {
    if (enviando) return;
    try {
      setEnviando(true);
      reproducirSonido("click", 0.4);
      await registrarUsuario(valores);
      reproducirSonido("confirmar", 0.5);
      toast.success("¡Cuenta creada correctamente! Bienvenido a Aethelgard.");
      navigate("/crear-personaje");
    } catch (error) {
      reproducirSonido("error", 0.5);
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
        <Card className="shadow-2xl border-4">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="flex justify-center mb-1">
              <Badge
                variant="outline"
                className="retro text-[10px] tracking-wider text-primary border-primary bg-primary/10 px-2 py-0.5"
              >
                ⚔️ GREMIO DE AVENTUREROS
              </Badge>
            </div>
            <CardTitle className="retro text-base sm:text-lg text-primary tracking-wide leading-relaxed">
              Registro de Explorador
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-normal max-w-xs mx-auto">
              Crea tu perfil de aventurero para adentrarte en los confines y misterios de Aethelgard.
            </CardDescription>
          </CardHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={enviando}
          >
            <CardContent className="space-y-4 pt-2">
              {/* Campo Nombre de Usuario */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nombreUsuario" className="text-xs font-semibold text-foreground">
                    Nombre de usuario
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Mín. 3 caracteres</span>
                </div>
                <Input
                  id="nombreUsuario"
                  type="text"
                  placeholder="ej. arturo_sendas"
                  autoComplete="username"
                  disabled={enviando}
                  aria-invalid={!!errors.nombreUsuario}
                  aria-describedby={
                    errors.nombreUsuario ? "error-nombre-usuario" : "guia-nombre-usuario"
                  }
                  {...register("nombreUsuario")}
                />
                <p id="guia-nombre-usuario" className="sr-only">
                  Solo letras, números y guión bajo.
                </p>
                {errors.nombreUsuario && (
                  <div
                    id="error-nombre-usuario"
                    className="flex items-center gap-1.5 text-xs text-destructive font-medium pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.nombreUsuario.message}</span>
                  </div>
                )}
              </div>

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
                  <span className="text-[10px] text-muted-foreground">Requisitos de seguridad</span>
                </div>
                <div className="relative">
                  <Input
                    id="clave"
                    type={mostrarClave ? "text" : "password"}
                    placeholder="Mín. 8 caracteres, número y símbolo"
                    autoComplete="new-password"
                    disabled={enviando}
                    className="pr-12"
                    aria-invalid={!!errors.clave}
                    aria-describedby={errors.clave ? "error-clave" : "requisitos-clave"}
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

                {/* Micro-inspección de robustez de contraseña */}
                <div
                  id="requisitos-clave"
                  className="bg-muted/40 p-2 border border-border/80 text-[11px] space-y-1 text-muted-foreground mt-1"
                >
                  <p className="font-medium text-foreground text-[10px] uppercase tracking-wider mb-1">
                    Criterios de seguridad:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        cumpleLargoMinimo ? "text-emerald-500 font-semibold" : ""
                      }`}
                    >
                      <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
                      8+ caracteres
                    </span>
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        cumpleNumero ? "text-emerald-500 font-semibold" : ""
                      }`}
                    >
                      <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
                      1 número
                    </span>
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        cumpleSimbolo ? "text-emerald-500 font-semibold" : ""
                      }`}
                    >
                      <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
                      1 símbolo
                    </span>
                  </div>
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
                    <span className="retro text-xs">CREANDO CUENTA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden="true" />
                    <span className="retro text-xs">REGISTRAR CUENTA</span>
                  </>
                )}
              </Button>

              {/* Enlaces secundarios de navegación */}
              <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-border/80 text-xs text-muted-foreground text-center">
                <div>
                  ¿Ya posees una cuenta de explorador?{" "}
                  <Link
                    to="/ingreso"
                    onClick={() => reproducirSonido("click", 0.3)}
                    className="text-primary underline underline-offset-4 hover:opacity-80 font-medium"
                  >
                    Inicia sesión aquí
                  </Link>
                </div>
                <div>
                  <Link
                    to="/creditos"
                    onClick={() => reproducirSonido("click", 0.3)}
                    className="hover:text-foreground transition-colors underline underline-offset-2 text-[11px]"
                  >
                    Ver créditos y licencias
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default PantallaRegistro;
