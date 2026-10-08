import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
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
import { Badge } from "@/components/ui/8bit/badge";
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  esquemaCrearPersonaje,
  type DatosCrearPersonaje,
} from "@/lib/esquemas-auth";
import { useAutenticacion } from "@/contextos/ContextoAutenticacion";
import { api, ErrorApi } from "@/api";

interface CriaturaOpcion {
  slug: "lobo-gris" | "pico-de-hacha" | "arana-lobo-gigante";
  nombre: string;
  tipo: string;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  descripcion: string;
}

const OPCIONES_CRIATURAS: CriaturaOpcion[] = [
  {
    slug: "lobo-gris",
    nombre: "Lobo Gris",
    tipo: "Bestia",
    hpBase: 30,
    ataqueBase: 42,
    defensaBase: 58,
    velocidadBase: 50,
    descripcion: "Fiel cazador de manada. Posee gran resistencia física y defensas sólidas.",
  },
  {
    slug: "pico-de-hacha",
    nombre: "Pico de Hacha",
    tipo: "Bestia",
    hpBase: 19,
    ataqueBase: 42,
    defensaBase: 51,
    velocidadBase: 60,
    descripcion: "Ave veloz y agresiva de las planicies con un impacto cortante letal.",
  },
  {
    slug: "arana-lobo-gigante",
    nombre: "Araña Lobo Gigante",
    tipo: "Bestia",
    hpBase: 11,
    ataqueBase: 44,
    defensaBase: 48,
    velocidadBase: 65,
    descripcion: "Depredadora nocturna de reflejos fulgurantes y mordedura venenosa.",
  },
];

export function PantallaCrearPersonaje() {
  const navigate = useNavigate();
  const { actualizarPersonajeActivo } = useAutenticacion();
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
  });

  const especieSeleccionada = useWatch({
    control,
    name: "especieInicialSlug",
  });

  const onSubmit = async (valores: DatosCrearPersonaje) => {
    try {
      setEnviando(true);
      await api.crearPersonaje({
        nombre: valores.nombre,
        especieInicialSlug: valores.especieInicialSlug,
      });
      await actualizarPersonajeActivo();
      toast.success(`¡Explorador ${valores.nombre} creado con éxito!`);
      navigate("/hub");
    } catch (error) {
      if (error instanceof ErrorApi) {
        toast.error(error.message);
      } else {
        toast.error("Ocurrió un error al crear el personaje.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8 px-2 sm:px-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-xl sm:text-3xl text-primary">
              Crea tu Explorador
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Define tu identidad de aventurero y elige a tu primera criatura compañera.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-1.5 max-w-md mx-auto">
                <Label htmlFor="nombre">Nombre del explorador</Label>
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
                    className="text-xs text-destructive font-medium"
                    role="alert"
                  >
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <Label className="text-sm font-semibold">
                    Selecciona tu criatura inicial
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Esta criatura será tu primer aliado en los combates y expediciones.
                  </p>
                  {errors.especieInicialSlug && (
                    <p className="text-xs text-destructive font-medium mt-1" role="alert">
                      {errors.especieInicialSlug.message}
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
                        onClick={() => setValue("especieInicialSlug", criatura.slug, { shouldValidate: true })}
                        className={`text-left transition-all cursor-pointer p-1 rounded focus:outline-hidden ${
                          seleccionada ? "ring-2 ring-primary scale-[1.02]" : "opacity-80 hover:opacity-100"
                        }`}
                        aria-pressed={seleccionada}
                      >
                        <Card className={`h-full border-2 ${seleccionada ? "border-primary bg-primary/5" : ""}`}>
                          <CardHeader className="p-3 pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-sm font-bold text-foreground">
                                {criatura.nombre}
                              </CardTitle>
                              <Badge variant={seleccionada ? "default" : "secondary"} className="text-[10px]">
                                {criatura.tipo}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 space-y-2 text-xs">
                            <p className="text-muted-foreground line-clamp-2">
                              {criatura.descripcion}
                            </p>
                            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/60 text-center font-mono text-[11px]">
                              <div>
                                <span className="text-muted-foreground block text-[9px]">HP</span>
                                <span className="font-semibold">{criatura.hpBase}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[9px]">ATQ</span>
                                <span className="font-semibold">{criatura.ataqueBase}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[9px]">DEF</span>
                                <span className="font-semibold">{criatura.defensaBase}</span>
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

            <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                className="w-full sm:w-auto px-8 flex items-center justify-center gap-2 mx-auto"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Iniciando aventura...</span>
                  </>
                ) : (
                  <span>Comenzar aventura en Villa Serena</span>
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
