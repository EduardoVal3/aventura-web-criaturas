import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Swords,
  User,
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
  esquemaRegistro,
  type DatosRegistro,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { ErrorApi } from "@/api";
import { reproducirSonido } from "@/lib/assets";
import { cn } from "@/lib/utils";

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
    <div className="relative min-h-[calc(100vh-10rem)] w-full flex flex-col items-center justify-center py-6 sm:py-10 px-3 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <Card className="shadow-2xl border-4 bg-card/95 backdrop-blur-xs">
          <CardHeader className="text-center space-y-2 pb-4 pt-6 px-4 sm:px-6">
            {/* Insignia temática retro sin emojis unicode (Regla R1) */}
            <div className="flex justify-center mb-1">
              <Badge
                variant="outline"
                className="retro text-[10px] tracking-wider text-primary border-primary/80 bg-primary/10 px-2.5 py-1 inline-flex items-center gap-1.5"
              >
                <Swords className="size-3 text-primary shrink-0" aria-hidden="true" />
                <span>GREMIO DE AVENTUREROS</span>
              </Badge>
            </div>

            <CardTitle className="retro text-base sm:text-lg text-primary tracking-wide leading-relaxed">
              Inscripción de Aventurero
            </CardTitle>

            <CardDescription className="retro text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Crea tu perfil de explorador para adentrarte en los confines y misterios de Aethelgard.
            </CardDescription>

            {/* Separador ornamental retro con degradado */}
            <div
              className="w-full h-1 bg-gradient-to-r from-transparent via-border to-transparent mt-2"
              aria-hidden="true"
            />
          </CardHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={enviando}
          >
            <CardContent className="space-y-4 pt-1 px-4 sm:px-6">
              {/* Campo Nombre de Usuario con estética retro 8bitcn */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="nombreUsuario"
                    className="retro text-[10px] sm:text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <User className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                    <span>Nombre de usuario</span>
                  </Label>
                  <span className="retro text-[9px] text-muted-foreground/80">
                    Mín. 3 car.
                  </span>
                </div>
                <Input
                  id="nombreUsuario"
                  type="text"
                  placeholder="ej. arturo_sendas"
                  autoComplete="username"
                  disabled={enviando}
                  className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 px-3 bg-background/60 focus-visible:bg-background transition-colors tracking-wide"
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
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.nombreUsuario.message}</span>
                  </div>
                )}
              </div>

              {/* Campo Correo Electrónico con estética retro 8bitcn */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="correo"
                  className="retro text-[10px] sm:text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
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
                  className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 px-3 bg-background/60 focus-visible:bg-background transition-colors tracking-wide"
                  aria-invalid={!!errors.correo}
                  aria-describedby={errors.correo ? "error-correo" : undefined}
                  {...register("correo")}
                />
                {errors.correo && (
                  <div
                    id="error-correo"
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.correo.message}</span>
                  </div>
                )}
              </div>

              {/* Campo Contraseña con Visibilidad Alternable y estética retro 8bitcn */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="clave"
                    className="retro text-[10px] sm:text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Lock className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                    <span>Contraseña</span>
                  </Label>
                  <span className="retro text-[9px] text-muted-foreground/80">
                    Llave secreta
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="clave"
                    type={mostrarClave ? "text" : "password"}
                    placeholder="Mín. 8 caracteres, número y símbolo"
                    autoComplete="new-password"
                    disabled={enviando}
                    className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 pl-3 pr-11 bg-background/60 focus-visible:bg-background transition-colors tracking-wide"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:text-primary focus-visible:outline-hidden disabled:opacity-40 transition-colors cursor-pointer"
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

                {/* Micro-inspección de robustez de contraseña con borde pixelado */}
                <div
                  id="requisitos-clave"
                  className="border-2 border-border/80 bg-background/50 p-2.5 space-y-1.5 mt-2"
                >
                  <p className="retro text-[9px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="size-3 text-primary shrink-0" aria-hidden="true" />
                    <span>Criterios de seguridad:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <span
                      className={cn(
                        "retro flex items-center gap-1.5 text-[9px] transition-colors",
                        cumpleLargoMinimo
                          ? "text-emerald-400 font-semibold"
                          : "text-muted-foreground/60"
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "size-3 shrink-0",
                          cumpleLargoMinimo ? "text-emerald-400" : "text-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      />
                      <span>8+ car.</span>
                    </span>
                    <span
                      className={cn(
                        "retro flex items-center gap-1.5 text-[9px] transition-colors",
                        cumpleNumero
                          ? "text-emerald-400 font-semibold"
                          : "text-muted-foreground/60"
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "size-3 shrink-0",
                          cumpleNumero ? "text-emerald-400" : "text-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      />
                      <span>1 número</span>
                    </span>
                    <span
                      className={cn(
                        "retro flex items-center gap-1.5 text-[9px] transition-colors",
                        cumpleSimbolo
                          ? "text-emerald-400 font-semibold"
                          : "text-muted-foreground/60"
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "size-3 shrink-0",
                          cumpleSimbolo ? "text-emerald-400" : "text-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      />
                      <span>1 símbolo</span>
                    </span>
                  </div>
                </div>

                {errors.clave && (
                  <div
                    id="error-clave"
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.clave.message}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-3 pb-6 px-4 sm:px-6">
              {/* Botón de envío con prevención de doble clic y estado de carga */}
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 h-12 shadow-md active:translate-y-1 cursor-pointer"
                disabled={enviando}
                aria-busy={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4 shrink-0" />
                    <span className="retro text-[10px] sm:text-xs tracking-wider">CREANDO CUENTA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="retro text-[10px] sm:text-xs tracking-wider">REGISTRAR CUENTA</span>
                  </>
                )}
              </Button>

              {/* Enlaces secundarios protegidos contra clics durante envío */}
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-between w-full gap-2.5 pt-3 border-t border-border/80 text-center sm:text-left",
                  enviando && "pointer-events-none opacity-50"
                )}
              >
                <Link
                  to="/ingreso"
                  onClick={() => reproducirSonido("click", 0.3)}
                  className="retro text-[10px] sm:text-xs text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  ¿Ya tienes cuenta? Ingresa
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

        {/* Nota de pie de seguridad gremial */}
        <div className="retro mt-4 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground/75 select-none tracking-wide text-center">
          <ShieldCheck className="size-3.5 text-primary/75 shrink-0" aria-hidden="true" />
          <span>Alianza de Exploradores de Aethelgard · Conexión Cifrada</span>
        </div>
      </div>
    </div>
  );
}

export default PantallaRegistro;
