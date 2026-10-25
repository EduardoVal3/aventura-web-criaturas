import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Heart,
  Swords,
  Shield,
  Zap,
  AlertCircle,
  LogOut,
  Sparkles,
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
  esquemaCrearPersonaje,
  type DatosCrearPersonaje,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { api, ErrorApi } from "@/api";
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";
import { OPCIONES_CRIATURAS } from "@/lib/criaturas-iniciales";
import { cn } from "@/lib/utils";

export function PantallaCrearPersonaje() {
  const navigate = useNavigate();
  const { actualizarPersonajeActivo, establecerPersonajeActivo, cerrarSesion } =
    useAutenticacion();
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<DatosCrearPersonaje>({
    resolver: zodResolver(esquemaCrearPersonaje),
    defaultValues: {
      nombre: "",
      especieInicialSlug: "lobo-estepario",
    },
    mode: "onChange",
  });

  const especieSeleccionada = useWatch({
    control,
    name: "especieInicialSlug",
  });

  const onSubmit = async (valores: DatosCrearPersonaje) => {
    if (enviando) return;
    try {
      setEnviando(true);
      reproducirSonido("click", 0.4);

      const respuesta = await api.crearPersonaje({
        nombre: valores.nombre,
        especieInicialSlug: valores.especieInicialSlug,
      });

      const personajeSincronizado = await actualizarPersonajeActivo();
      if (!personajeSincronizado && respuesta) {
        establecerPersonajeActivo({
          personajeId: respuesta.personajeId,
          nombre: respuesta.nombre,
          monedas: respuesta.monedas,
          ubicacionActualId: respuesta.ubicacionActualId,
          totalCriaturasEquipo: 1,
          totalCriaturasAlmacen: 0,
        });
      }

      reproducirSonido("confirmar", 0.5);
      toast.success(`¡Explorador ${valores.nombre} creado con éxito!`);
      navigate("/hub");
    } catch (error) {
      reproducirSonido("error", 0.5);
      if (error instanceof ErrorApi) {
        // simplificacion: si la sesión no existe en el servidor o expiró, se limpia y remite al ingreso
        if (error.estado === 401 || error.codigo === "USUARIO_NO_ENCONTRADO") {
          toast.error(
            "Sesión inválida o expirada. Por favor regístrate o inicia sesión de nuevo."
          );
          await cerrarSesion();
          navigate("/ingreso");
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Ocurrió un error al crear el personaje.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const criaturaActiva = OPCIONES_CRIATURAS.find(
    (c) => c.slug === especieSeleccionada
  );

  return (
    <div className="relative min-h-[calc(100vh-10rem)] w-full flex flex-col items-center justify-center py-6 sm:py-10 px-3 sm:px-6">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-2xl border-4 bg-card/95 backdrop-blur-xs">
          <CardHeader className="text-center space-y-2 pb-4 pt-6 px-4 sm:px-6">
            {/* Cabecera con Insignia retro y Escape Hatch accesible */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <Badge
                variant="outline"
                className="retro text-[10px] tracking-wider text-primary border-primary/80 bg-primary/10 px-2.5 py-1 inline-flex items-center gap-1.5"
              >
                <Sparkles className="size-3 text-primary shrink-0" aria-hidden="true" />
                <span>COMPAÑERO INICIAL</span>
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={enviando}
                onClick={async () => {
                  if (enviando) return;
                  reproducirSonido("click", 0.4);
                  await cerrarSesion();
                  navigate("/ingreso");
                }}
                className={cn(
                  "retro text-[9px] sm:text-[10px] tracking-wider flex items-center gap-1.5 h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground transition-opacity",
                  enviando && "pointer-events-none opacity-50"
                )}
                title="Cerrar sesión y volver al portal de ingreso"
              >
                <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
                <span>SALIR AL INGRESO</span>
              </Button>
            </div>

            <CardTitle className="retro text-base sm:text-lg text-primary tracking-wide leading-relaxed">
              Crea tu Explorador
            </CardTitle>

            <CardDescription className="retro text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto">
              Define la identidad de tu aventurero y elige a tu primera criatura
              compañera para iniciar la senda en Villa Serena.
            </CardDescription>

            {/* Separador ornamental retro */}
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
            <CardContent className="space-y-6 pt-2 px-4 sm:px-6">
              {/* Campo: Nombre del explorador con estética retro 8bitcn */}
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="nombre"
                    className="retro text-[10px] sm:text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <User className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                    <span>Nombre del explorador</span>
                  </Label>
                  <span className="retro text-[9px] text-muted-foreground/80">
                    Mín. 3 car.
                  </span>
                </div>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="ej. Arturo de Sendas"
                  disabled={enviando}
                  aria-invalid={!!errors.nombre}
                  aria-describedby={
                    errors.nombre ? "error-nombre-pj" : "guia-nombre-pj"
                  }
                  className="retro text-[10px] sm:text-xs placeholder:text-[9px] sm:placeholder:text-[10px] h-10 px-3 bg-background/60 focus-visible:bg-background transition-colors tracking-wide"
                  {...register("nombre")}
                />
                <p id="guia-nombre-pj" className="sr-only">
                  Introduce al menos 3 caracteres para nombrar a tu explorador.
                </p>
                {errors.nombre && (
                  <div
                    id="error-nombre-pj"
                    className="retro flex items-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-0.5"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.nombre.message}</span>
                  </div>
                )}
              </div>

              {/* Selección interactiva de criatura inicial */}
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary/80 shrink-0" aria-hidden="true" />
                    <Label className="retro text-xs sm:text-sm text-foreground uppercase tracking-wide">
                      Selecciona tu criatura inicial
                    </Label>
                  </div>
                  <p className="retro text-[10px] sm:text-[11px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Esta criatura será tu primer aliado en los combates y
                    expediciones por Aethelgard.
                  </p>
                  {errors.especieInicialSlug && (
                    <div
                      className="retro flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-destructive pt-1"
                      role="alert"
                    >
                      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.especieInicialSlug.message}</span>
                    </div>
                  )}
                </div>

                {/* Cuadrícula responsiva de criaturas iniciales (360px apilado, md en 3 columnas) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {OPCIONES_CRIATURAS.map((criatura) => {
                    const seleccionada = especieSeleccionada === criatura.slug;
                    return (
                      <button
                        key={criatura.slug}
                        type="button"
                        disabled={enviando}
                        onClick={() => {
                          setValue("especieInicialSlug", criatura.slug, {
                            shouldValidate: true,
                          });
                          reproducirSonido("seleccionar", 0.35);
                        }}
                        className={cn(
                          "group text-left transition-all cursor-pointer p-0 rounded-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary w-full",
                          seleccionada
                            ? "scale-[1.02]"
                            : "opacity-90 hover:opacity-100 hover:scale-[1.01]",
                          enviando && "pointer-events-none opacity-60"
                        )}
                        aria-pressed={seleccionada}
                      >
                        <Card
                          className={cn(
                            "h-full transition-all p-0 relative border-2",
                            seleccionada
                              ? "border-primary bg-primary/10 shadow-[6px_6px_0_0_#000]"
                              : "border-black shadow-[4px_4px_0_0_#000] bg-card hover:border-primary/50"
                          )}
                        >
                          <CardHeader className="p-3 pb-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <CardTitle className="retro text-[11px] sm:text-xs font-bold text-foreground truncate">
                                {criatura.nombre}
                              </CardTitle>
                              {seleccionada ? (
                                <Badge
                                  variant="default"
                                  className="retro text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground border-primary"
                                >
                                  ELEGIDO
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="retro text-[8px] sm:text-[9px] px-1.5 py-0.5 border-border/80 text-muted-foreground"
                                >
                                  {criatura.tipo}
                                </Badge>
                              )}
                            </div>
                            <p className="retro text-[9px] sm:text-[10px] text-primary tracking-wide">
                              {criatura.arquetipo}
                            </p>
                          </CardHeader>

                          <CardContent className="p-3 pt-0 space-y-3">
                            {/* Visualizador pixelado del sprite con fallback SVG */}
                            <div className="relative w-full h-28 bg-muted/20 border-2 border-black flex items-center justify-center p-2 overflow-hidden shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]">
                              <img
                                src={obtenerImagenCriatura(criatura.slug)}
                                alt={`Sprite de ${criatura.nombre}`}
                                onError={(e) =>
                                  manejarErrorImagen(e, "criatura")
                                }
                                className={cn(
                                  "size-20 object-contain pixelated transition-transform duration-200",
                                  seleccionada
                                    ? "scale-110 drop-shadow-[0_0_8px_rgba(20,209,232,0.5)]"
                                    : "group-hover:scale-105"
                                )}
                                loading="lazy"
                              />
                            </div>

                            <p className="retro text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                              {criatura.descripcion}
                            </p>

                            {/* Desglose de Atributos Base 8-Bit (HP, ATQ, DEF, VEL) */}
                            <div className="space-y-1.5 pt-2 border-t border-border/60">
                              {/* HP Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] font-bold">
                                  <span className="retro text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Heart
                                      className="size-3 text-emerald-400 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>HP</span>
                                  </span>
                                  <span className="retro text-[9px] font-bold text-emerald-400">
                                    {criatura.hpBase}
                                  </span>
                                </div>
                                <div className="w-full bg-black/50 h-2 overflow-hidden border border-black p-[1px] shadow-[inset_1px_1px_0_0_#000]">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round((criatura.hpBase / 50) * 100)
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Ataque Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] font-bold">
                                  <span className="retro text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Swords
                                      className="size-3 text-amber-400 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>ATQ</span>
                                  </span>
                                  <span className="retro text-[9px] font-bold text-amber-400">
                                    {criatura.ataqueBase}
                                  </span>
                                </div>
                                <div className="w-full bg-black/50 h-2 overflow-hidden border border-black p-[1px] shadow-[inset_1px_1px_0_0_#000]">
                                  <div
                                    className="bg-amber-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (criatura.ataqueBase / 60) * 100
                                        )
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Defensa Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] font-bold">
                                  <span className="retro text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Shield
                                      className="size-3 text-blue-400 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>DEF</span>
                                  </span>
                                  <span className="retro text-[9px] font-bold text-blue-400">
                                    {criatura.defensaBase}
                                  </span>
                                </div>
                                <div className="w-full bg-black/50 h-2 overflow-hidden border border-black p-[1px] shadow-[inset_1px_1px_0_0_#000]">
                                  <div
                                    className="bg-blue-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (criatura.defensaBase / 75) * 100
                                        )
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Velocidad Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] font-bold">
                                  <span className="retro text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Zap
                                      className="size-3 text-cyan-400 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>VEL</span>
                                  </span>
                                  <span className="retro text-[9px] font-bold text-cyan-400">
                                    {criatura.velocidadBase}
                                  </span>
                                </div>
                                <div className="w-full bg-black/50 h-2 overflow-hidden border border-black p-[1px] shadow-[inset_1px_1px_0_0_#000]">
                                  <div
                                    className="bg-cyan-400 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (criatura.velocidadBase / 75) * 100
                                        )
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 px-4 sm:px-6 border-t border-border/80">
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <div className="retro text-[9px] sm:text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Compañero seleccionado:
                  </span>{" "}
                  <span className="text-primary font-bold">
                    {criaturaActiva?.nombre} ({criaturaActiva?.arquetipo})
                  </span>
                </div>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={async () => {
                    if (enviando) return;
                    reproducirSonido("click", 0.4);
                    await cerrarSesion();
                    navigate("/ingreso");
                  }}
                  className={cn(
                    "retro text-[9px] sm:text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 flex items-center justify-center sm:justify-start gap-1 cursor-pointer",
                    enviando && "pointer-events-none opacity-50"
                  )}
                >
                  <LogOut className="size-3 shrink-0" aria-hidden="true" />
                  <span>¿Deseas ingresar con otra cuenta? Cerrar sesión</span>
                </button>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 flex items-center justify-center gap-2 cursor-pointer transition-all"
                disabled={enviando}
                aria-busy={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    <span className="retro text-[10px] sm:text-xs tracking-wider">
                      INICIANDO AVENTURA...
                    </span>
                  </>
                ) : (
                  <>
                    <Swords
                      className="size-4 mr-1 text-primary-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <span className="retro text-[10px] sm:text-xs tracking-wider">
                      COMENZAR EN VILLA SERENA
                    </span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default PantallaCrearPersonaje;
