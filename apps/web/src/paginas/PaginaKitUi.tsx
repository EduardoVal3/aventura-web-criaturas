import { useEffect, useState, type FormEvent } from "react";

import { api, type PersonajeActivo } from "@/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/8bit/alert-dialog";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/8bit/dialog";
import EnemyHealthDisplay from "@/components/ui/8bit/enemy-health-display";
import HealthBar from "@/components/ui/8bit/health-bar";
import XpBar from "@/components/ui/8bit/xp-bar";
import { Input } from "@/components/ui/8bit/input";
import { Label } from "@/components/ui/8bit/label";
import { Progress } from "@/components/ui/8bit/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/8bit/select";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { Spinner } from "@/components/ui/8bit/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/8bit/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/8bit/tabs";
import { toast } from "@/components/ui/8bit/toast";

export function PaginaKitUi() {
  // Estado para el formulario de prueba
  const [nombreExplorador, setNombreExplorador] = useState("");
  const [especieSeleccionada, setEspecieSeleccionada] = useState("lobo-gris");
  const [mensajeFormulario, setMensajeFormulario] = useState<string | null>(null);

  // Estado para la sección de carga con API simulada
  const [personaje, setPersonaje] = useState<PersonajeActivo | null>(null);
  const [cargandoApi, setCargandoApi] = useState(true);

  const cargarDatosPersonaje = async () => {
    setCargandoApi(true);
    try {
      const datos = await api.obtenerPersonajeActivo();
      setPersonaje(datos);
    } catch {
      toast("Error al cargar los datos del personaje.");
    } finally {
      setCargandoApi(false);
    }
  };

  useEffect(() => {
    let activo = true;
    api
      .obtenerPersonajeActivo()
      .then((datos) => {
        if (activo) {
          setPersonaje(datos);
          setCargandoApi(false);
        }
      })
      .catch(() => {
        if (activo) {
          setCargandoApi(false);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  const manejarEnvioFormulario = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensajeFormulario(
      `¡Explorador ${nombreExplorador} listo con compañero ${especieSeleccionada}!`
    );
    toast(`Formulario validado: ${nombreExplorador}`);
  };

  return (
    <div className="space-y-10 py-6 max-w-full overflow-x-hidden">
      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold retro tracking-tight text-primary">
          Kit de interfaz
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Catálogo interactivo con los 17 componentes de 8bitcn/ui adaptados al reino de Aethelgard.
        </p>
      </header>

      {/* 1. Acciones */}
      <section className="space-y-4" aria-labelledby="seccion-acciones">
        <h2 id="seccion-acciones" className="text-xl sm:text-2xl font-semibold retro">
          Acciones y etiquetas
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => toast("Acción ejecutada")}>Botón principal</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="destructive">Destructivo</Button>
          <Button variant="outline">Contorno</Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center pt-2">
          <Badge>Común</Badge>
          <Badge variant="secondary">Especial</Badge>
          <Badge variant="destructive">Peligro</Badge>
          <Badge variant="outline">Neutral</Badge>
        </div>
      </section>

      {/* 2. Formulario */}
      <section className="space-y-4" aria-labelledby="seccion-formulario">
        <h2 id="seccion-formulario" className="text-xl sm:text-2xl font-semibold retro">
          Formulario de expedición
        </h2>
        <form
          onSubmit={manejarEnvioFormulario}
          className="max-w-md space-y-4 border border-border p-4 sm:p-6 bg-card"
        >
          <div className="space-y-2">
            <Label htmlFor="nombre-explorador">Nombre del explorador</Label>
            <Input
              id="nombre-explorador"
              name="nombreExplorador"
              required
              minLength={3}
              placeholder="Ej. Arturo Sendas"
              value={nombreExplorador}
              onChange={(e) => setNombreExplorador(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="especie-inicial">Criatura acompañante</Label>
            <Select
              value={especieSeleccionada}
              onValueChange={setEspecieSeleccionada}
            >
              <SelectTrigger id="especie-inicial" className="w-full">
                <SelectValue placeholder="Selecciona una criatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lobo-gris">Lobo Gris (Nivel 1)</SelectItem>
                <SelectItem value="pico-de-hacha">Pico de Hacha (Nivel 2)</SelectItem>
                <SelectItem value="arana-lobo-gigante">Araña Lobo Gigante (Nivel 1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Registrar expedición
          </Button>

          {mensajeFormulario && (
            <p className="text-xs text-primary font-semibold mt-2 retro">
              {mensajeFormulario}
            </p>
          )}
        </form>
      </section>

      {/* 3. Tarjetas */}
      <section className="space-y-4" aria-labelledby="seccion-tarjetas">
        <h2 id="seccion-tarjetas" className="text-xl sm:text-2xl font-semibold retro">
          Tarjetas de criaturas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lobo Gris</CardTitle>
                <Badge>Bestia</Badge>
              </div>
              <CardDescription>Depredador ágil de las llanuras</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p>Ataque base: 42 · Defensa base: 58</p>
              <p>Velocidad: 50 · Tasa de captura: 88%</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full">
                Ver ficha completa
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pico de Hacha</CardTitle>
                <Badge variant="secondary">Aviar</Badge>
              </div>
              <CardDescription>Ave corredora de gran fortaleza</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p>Ataque base: 42 · Defensa base: 51</p>
              <p>Velocidad: 60 · Tasa de captura: 85%</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full">
                Ver ficha completa
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. Vida y experiencia */}
      <section className="space-y-4" aria-labelledby="seccion-barras">
        <h2 id="seccion-barras" className="text-xl sm:text-2xl font-semibold retro">
          Vida, experiencia y progreso
        </h2>
        <div className="space-y-6 max-w-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>HP de Criatura Aliada (Lobo Gris)</span>
              <span>25 / 30 HP</span>
            </div>
            <HealthBar value={83} />
          </div>

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground block">HP del Enemigo en Combate</span>
            <EnemyHealthDisplay
              enemyName="Pico de Hacha"
              level={2}
              currentHealth={14}
              maxHealth={19}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Experiencia acumulada</span>
              <span>100% - ¡Listo para subir!</span>
            </div>
            <XpBar value={100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso de expedición en zona</span>
              <span>65%</span>
            </div>
            <Progress value={65} />
          </div>
        </div>
      </section>

      {/* 5. Navegación */}
      <section className="space-y-4" aria-labelledby="seccion-pestanas">
        <h2 id="seccion-pestanas" className="text-xl sm:text-2xl font-semibold retro">
          Pestañas de gestión
        </h2>
        <Tabs defaultValue="equipo" className="max-w-lg">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="equipo">Equipo (2)</TabsTrigger>
            <TabsTrigger value="almacen">Almacén (1)</TabsTrigger>
            <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          </TabsList>
          <TabsContent value="equipo" className="p-4 border border-border mt-2 bg-card text-xs space-y-1">
            <p className="font-bold">Criaturas activas:</p>
            <p>1. Lobo Gris (Nivel 2) - Líder</p>
            <p>2. Pico de Hacha (Nivel 2)</p>
          </TabsContent>
          <TabsContent value="almacen" className="p-4 border border-border mt-2 bg-card text-xs space-y-1">
            <p className="font-bold">Criaturas resguardadas:</p>
            <p>1. Araña Lobo Gigante (Nivel 1)</p>
          </TabsContent>
          <TabsContent value="ajustes" className="p-4 border border-border mt-2 bg-card text-xs">
            <p>Opciones de sonido y visualización retro.</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* 6. Datos */}
      <section className="space-y-4" aria-labelledby="seccion-datos">
        <h2 id="seccion-datos" className="text-xl sm:text-2xl font-semibold retro">
          Inventario de expedición
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>Objetos y suministros del explorador en Villa Serena.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Talismán Básico de Captura</TableCell>
                <TableCell>Captura</TableCell>
                <TableCell className="text-right">3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Poción de Curación Menor</TableCell>
                <TableCell>Curación</TableCell>
                <TableCell className="text-right">2</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Monedas de Oro</TableCell>
                <TableCell>Divisa</TableCell>
                <TableCell className="text-right">120</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 7. Diálogos */}
      <section className="space-y-4" aria-labelledby="seccion-dialogos">
        <h2 id="seccion-dialogos" className="text-xl sm:text-2xl font-semibold retro">
          Diálogos y confirmaciones
        </h2>
        <div className="flex flex-wrap gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir diálogo de encuentro</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>¡Encuentro en el camino!</DialogTitle>
                <DialogDescription>
                  Un Lobo Gris salvaje ha aparecido entre los matorrales de Praderas del Amanecer.
                </DialogDescription>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                ¿Deseas entrar en combate o intentar evadir a la criatura?
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline">Evadir</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => toast("¡Iniciando combate!")}>Luchar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Confirmar retirada</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Huir de la batalla?</AlertDialogTitle>
                <AlertDialogDescription>
                  Si te retiras ahora, no recibirás puntos de experiencia ni oportunidad de capturar a la criatura salvaje.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Permanecer</AlertDialogCancel>
                <AlertDialogAction onClick={() => toast("Has huido del combate con éxito.")}>
                  Confirmar huida
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      {/* 8. Avisos (Toast) */}
      <section className="space-y-4" aria-labelledby="seccion-avisos">
        <h2 id="seccion-avisos" className="text-xl sm:text-2xl font-semibold retro">
          Avisos de eventos
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => toast("¡Has capturado a Pico de Hacha!")}
            variant="secondary"
          >
            Disparar aviso de captura
          </Button>
          <Button
            onClick={() => toast("¡Lobo Gris subió al nivel 3!")}
            variant="outline"
          >
            Disparar aviso de nivel
          </Button>
        </div>
      </section>

      {/* 9. Carga con API simulada */}
      <section className="space-y-4" aria-labelledby="seccion-carga">
        <h2 id="seccion-carga" className="text-xl sm:text-2xl font-semibold retro">
          Carga y estado con API simulada
        </h2>
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Estado del explorador</CardTitle>
              {cargandoApi ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Spinner variant="diamond" className="size-4" />
                  <span>Consultando API...</span>
                </div>
              ) : (
                <Badge>Conectado</Badge>
              )}
            </div>
            <CardDescription>
              Petición asíncrona a la capa ApiJuego en modo simulado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cargandoApi ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            ) : personaje ? (
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-bold">Nombre:</span> {personaje.nombre}
                </p>
                <p>
                  <span className="font-bold">Monedas:</span> {personaje.monedas}
                </p>
                <p>
                  <span className="font-bold">Ubicación actual:</span> {personaje.ubicacionActualId}
                </p>
                <p>
                  <span className="font-bold">Equipo activo:</span> {personaje.totalCriaturasEquipo} criaturas
                </p>
                <p>
                  <span className="font-bold">Almacén:</span> {personaje.totalCriaturasAlmacen} criaturas
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos disponibles.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void cargarDatosPersonaje()}
              disabled={cargandoApi}
              className="w-full"
            >
              {cargandoApi ? "Cargando..." : "Recargar datos simulados"}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}

export default PaginaKitUi;
