import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Heart, Swords, Shield, Zap, AlertCircle } from "lucide-react";

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

export function PantallaCrearPersonaje() {
  const navigate = useNavigate();
  const { actualizarPersonajeActivo, establecerPersonajeActivo } =
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
      especieInicialSlug: "lobo-gris",
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
        toast.error(error.message);
      } else {
        toast.error("Ocurrió un error al crear el personaje.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const criaturaActiva = OPCIONES_CRIATURAS.find(
    (c) => c.slug === especieSeleccionada,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8 px-2 sm:px-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl border-4">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="flex justify-center mb-1">
              <Badge
                variant="outline"
                className="retro text-[10px] tracking-wider text-primary border-primary bg-primary/10 px-2 py-0.5"
              >
                🐾 COMPAÑERO INICIAL
              </Badge>
            </div>
            <CardTitle className="retro text-base sm:text-xl text-primary tracking-wide leading-relaxed">
              Crea tu Explorador
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-normal max-w-md mx-auto">
              Define la identidad de tu aventurero y elige a tu primera criatura
              compañera para iniciar la senda en Villa Serena.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={enviando}>
            <CardContent className="space-y-6 pt-2">
              {/* Campo: Nombre del explorador */}
              <div className="space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="nombre"
                    className="text-xs sm:text-sm font-semibold text-foreground"
                  >
                    Nombre del explorador
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Mín. 3 caracteres
                  </span>
                </div>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="ej. Arturo de Sendas"
                  disabled={enviando}
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? "error-nombre-pj" : undefined}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p
                    id="error-nombre-pj"
                    className="text-xs text-destructive flex items-center gap-1.5 font-medium"
                    role="alert"
                  >
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.nombre.message}</span>
                  </p>
                )}
              </div>

              {/* Selección interactiva de criatura inicial */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <Label className="retro text-xs sm:text-sm text-foreground">
                    Selecciona tu criatura inicial
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Esta criatura será tu primer aliado en los combates y
                    expediciones por Aethelgard.
                  </p>
                  {errors.especieInicialSlug && (
                    <p
                      className="text-xs text-destructive flex items-center justify-center gap-1 font-medium mt-1"
                      role="alert"
                    >
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.especieInicialSlug.message}</span>
                    </p>
                  )}
                </div>

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
                        className={`group text-left transition-all cursor-pointer p-0.5 rounded-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                          seleccionada
                            ? "scale-[1.02] shadow-xl"
                            : "opacity-85 hover:opacity-100 hover:scale-[1.01]"
                        }`}
                        aria-pressed={seleccionada}
                      >
                        <Card
                          className={`h-full border-4 transition-colors ${
                            seleccionada
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border/60 hover:border-primary/50 bg-card"
                          }`}
                        >
                          <CardHeader className="p-3 pb-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <CardTitle className="retro text-xs sm:text-sm font-bold text-foreground truncate">
                                {criatura.nombre}
                              </CardTitle>
                              {seleccionada ? (
                                <Badge
                                  variant="default"
                                  className="retro text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground border-primary"
                                >
                                  ELEGIDO
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0.5 font-mono"
                                >
                                  {criatura.tipo}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-primary font-medium">
                              {criatura.arquetipo}
                            </p>
                          </CardHeader>

                          <CardContent className="p-3 pt-0 space-y-3">
                            {/* Visualizador pixelado del sprite con fallback SVG */}
                            <div className="relative w-full h-28 bg-muted/40 border-2 border-border/60 flex items-center justify-center p-2 overflow-hidden">
                              <img
                                src={obtenerImagenCriatura(criatura.slug)}
                                alt={`Sprite de ${criatura.nombre}`}
                                onError={(e) =>
                                  manejarErrorImagen(e, "criatura")
                                }
                                className={`size-20 object-contain pixelated transition-transform duration-200 ${
                                  seleccionada
                                    ? "scale-110 drop-shadow-[0_0_6px_rgba(20,209,232,0.45)]"
                                    : "group-hover:scale-105"
                                }`}
                                loading="lazy"
                              />
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2rem]">
                              {criatura.descripcion}
                            </p>

                            {/* Desglose de Atributos Base (HP, ATQ, DEF, VEL) */}
                            <div className="space-y-1.5 pt-2 border-t border-border/60 font-mono text-xs">
                              {/* HP Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Heart className="size-3 text-emerald-500" />{" "}
                                    HP
                                  </span>
                                  <span className="font-semibold text-emerald-500">
                                    {criatura.hpBase}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 h-1.5 overflow-hidden border border-border/40">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.round(
                                        (criatura.hpBase / 40) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Ataque Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Swords className="size-3 text-amber-500" />{" "}
                                    ATQ
                                  </span>
                                  <span className="font-semibold text-amber-500">
                                    {criatura.ataqueBase}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 h-1.5 overflow-hidden border border-border/40">
                                  <div
                                    className="bg-amber-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.round(
                                        (criatura.ataqueBase / 60) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Defensa Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Shield className="size-3 text-blue-500" />{" "}
                                    DEF
                                  </span>
                                  <span className="font-semibold text-blue-500">
                                    {criatura.defensaBase}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 h-1.5 overflow-hidden border border-border/40">
                                  <div
                                    className="bg-blue-500 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.round(
                                        (criatura.defensaBase / 70) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Velocidad Base */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Zap className="size-3 text-cyan-400" /> VEL
                                  </span>
                                  <span className="font-semibold text-cyan-400">
                                    {criatura.velocidadBase}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 h-1.5 overflow-hidden border border-border/40">
                                  <div
                                    className="bg-cyan-400 h-full transition-all duration-300"
                                    style={{
                                      width: `${Math.round(
                                        (criatura.velocidadBase / 75) * 100,
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

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span className="font-semibold text-foreground">
                  Compañero seleccionado:
                </span>{" "}
                <span className="font-mono text-primary font-bold">
                  {criaturaActiva?.nombre} ({criaturaActiva?.arquetipo})
                </span>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto px-8 py-5 flex items-center justify-center gap-2 cursor-pointer"
                disabled={enviando}
                aria-busy={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    <span className="retro text-xs tracking-wider">
                      INICIANDO AVENTURA...
                    </span>
                  </>
                ) : (
                  <span className="retro text-xs tracking-wider">
                    COMENZAR EN VILLA SERENA ⚔️
                  </span>
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
