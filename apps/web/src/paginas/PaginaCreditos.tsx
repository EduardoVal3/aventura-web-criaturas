import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Trophy,
  Crown,
  Sparkles,
  ArrowLeft,
  Volume2,
  Award,
  GraduationCap,
  Code2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  obtenerImagenCriatura,
  manejarErrorImagen,
  reproducirSonido,
} from "@/lib/assets";

export function PaginaCreditos() {
  const navigate = useNavigate();
  const [celebrando, setCelebrando] = useState(false);

  const festejarFanfarria = () => {
    setCelebrando(true);
    reproducirSonido("fanfarria");
    setTimeout(() => {
      setCelebrando(false);
    }, 1200);
  };

  const criaturasEmblematicas = [
    { slug: "lobo-estepario", nombre: "Lobo Estepario", tipo: "Bestia" },
    { slug: "grifo", nombre: "Grifo", tipo: "Monstruosidad" },
    { slug: "quimera-tricefala", nombre: "Quimera Tricéfala", tipo: "Monstruosidad" },
    { slug: "hidra-de-las-marismas", nombre: "Hidra de las Marismas", tipo: "Monstruosidad" },
  ];

  return (
    <div className="space-y-8 py-4 sm:py-6 max-w-5xl mx-auto overflow-x-hidden">
      {/* Cabecera Ceremonial: Salón de la Fama / Ending RPG 16-bit */}
      <div className="border-2 border-amber-500/80 bg-bastion p-4 sm:p-6 rounded-none space-y-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/80 font-mono text-xs px-2 py-0.5 rounded-none flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                SALÓN DE LA FAMA
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                ISC-305 · III PAC 2026
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold retro tracking-tight text-primary mt-2">
              AETHELGARD: CRÉDITOS Y HONOR
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Conclusión del desarrollo full-stack, homenajes académicos y licencias abiertas.
            </p>
          </div>

          {/* Botones de Cabecera */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              className="text-xs rounded-none bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5"
              onClick={festejarFanfarria}
              disabled={celebrando}
              aria-busy={celebrando}
            >
              <Volume2 className={`w-3.5 h-3.5 ${celebrando ? "animate-bounce" : ""}`} aria-hidden="true" />
              <span>{celebrando ? "CELEBRANDO..." : "CELEBRAR FANFARRIA"}</span>
            </Button>

            <Button
              id="boton-volver-inicio-creditos"
              data-testid="boton-volver-inicio-creditos"
              variant="outline"
              size="sm"
              className="text-xs rounded-none flex items-center gap-1.5"
              onClick={() => {
                reproducirSonido("victoria");
                navigate("/hub");
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Volver al Asentamiento</span>
            </Button>
          </div>
        </div>

        {/* Galería Decorativa de Criaturas Emblemáticas */}
        <div className="pt-3 border-t border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block font-mono mb-2">
            Bestiario Victorioso de Aethelgard
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {criaturasEmblematicas.map((criatura) => (
              <div
                key={criatura.slug}
                className="bg-abismo/90 border border-amber-500/50 p-2 rounded-none flex items-center gap-2"
              >
                <div className="w-12 h-12 shrink-0 bg-bastion border border-border flex items-center justify-center p-1">
                  <img
                    src={obtenerImagenCriatura(criatura.slug)}
                    alt={criatura.nombre}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    className="pixelated h-10 w-10 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground block truncate retro text-[10px]">
                    {criatura.nombre}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase font-mono">
                    {criatura.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Homenaje Académico: Profesor / Ingeniero Claudio */}
      <section aria-labelledby="homenaje-claudio">
        <Card className="border-2 border-primary/70 bg-bastion rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" aria-hidden="true" />
                <CardTitle id="homenaje-claudio" className="text-base sm:text-lg text-primary retro">
                  Homenaje Académico — Ingeniero Claudio
                </CardTitle>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary font-mono text-[10px] rounded-none">
                ISC-305 PROGRAMACIÓN WEB
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Cátedra de Programación Web y Arquitectura de Sistemas de Información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            <p>
              Dedicamos este proyecto al <strong className="text-foreground">Ingeniero Claudio</strong> en agradecimiento por su exigencia metodológica y su visión docente en la asignatura <strong className="text-foreground">ISC-305 Programación Web</strong>. Su énfasis constante en el rigor arquitectónico, la eliminación de antipatrones como las ráfagas N+1, la validación estricta en servidor y la trazabilidad documental impulsó cada decisión técnica detrás de <em>Aethelgard: Sendas y Criaturas</em>.
            </p>
            <div className="p-3 bg-background border border-border/70 font-mono text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Principios Rectores Aplicados:</span>
              </div>
              <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5">
                <li>Validación soberana en Back-End (NestJS) y salvaguarda de invariantes estocásticas.</li>
                <li>Ergonomía responsive sin overflow horizontal en 320px bajo el estándar Impeccable.</li>
                <li>Arquitectura en capas, contratos unificados en TypeScript y 100% de pruebas verdes.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Equipo de Desarrollo y Arquitectura Full-Stack */}
      <section aria-labelledby="equipo-desarrollo">
        <Card className="border-2 border-border/80 bg-bastion rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <CardTitle id="equipo-desarrollo" className="text-base sm:text-lg text-foreground retro">
                  Equipo de Desarrollo y Arquitectura
                </CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] rounded-none">
                AV5 · FASE 10
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Ingeniería de software, diseño de mecánicas RPG y experiencia retro 16-bit
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            <p>
              El proyecto <em>Aethelgard: Sendas y Criaturas</em> fue concebido como un juego de rol y estrategia web que revive la era dorada de los videojuegos de 8 y 16 bits, combinando estándares contemporáneos de seguridad (S-1 a S-7) e invariantes de negocio inquebrantables (INV-01 a INV-05).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Front-End</span>
                <span className="text-foreground font-semibold">React 19 + Vite</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tailwind CSS v4 & 8bitcn/ui</p>
              </div>
              <div className="p-2.5 bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Back-End</span>
                <span className="text-foreground font-semibold">NestJS 11 + Prisma</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">PostgreSQL & Swagger OpenAPI</p>
              </div>
              <div className="p-2.5 bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Audio & Assets</span>
                <span className="text-foreground font-semibold">Web Audio API</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Síntesis retro nativa 8-bit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sistema de diseño retro: 8bitcn/ui y Motor de Audio */}
      <section className="space-y-4" aria-labelledby="seccion-8bitcn">
        <Card className="border-2 border-border/80 bg-bastion rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                <CardTitle id="seccion-8bitcn" className="text-base sm:text-lg text-foreground retro">
                  Sistema de Diseño 8bitcn/ui y Audio Web Audio API
                </CardTitle>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] rounded-none">
                Licencia MIT
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Componentes de interfaz nostálgicos para React y sintetizador por software
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-4 text-xs sm:text-sm">
            <p className="text-muted-foreground leading-relaxed">
              Los componentes visuales retro utilizados en este proyecto provienen de{" "}
              <a
                href="https://github.com/TheOrcDev/8bitcn-ui"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80 font-mono"
              >
                8bitcn/ui (TheOrcDev/8bitcn-ui)
              </a>
              , distribuidos bajo la Licencia MIT. El subsistema de audio opera mediante síntesis de ondas cuadradas y diente de sierra a través de la API estándar Web Audio sin dependencias pesadas de audio externas.
            </p>
            <div className="p-3 bg-background border border-border/70 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
{`MIT License

Copyright (c) 2025 8bitcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Fuente de criaturas: Open5e y Wizards of the Coast (SRD 5.2) */}
      <section className="space-y-4" aria-labelledby="seccion-open5e">
        <Card className="border-2 border-border/80 bg-bastion rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
                <CardTitle id="seccion-open5e" className="text-base sm:text-lg text-foreground retro">
                  Catálogo de Criaturas: Open5e y SRD 5.2
                </CardTitle>
              </div>
              <Badge className="font-mono text-[10px] rounded-none">
                CC BY 4.0
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Datos estadísticos y criaturas fantásticas del System Reference Document 5.2
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-4 text-xs sm:text-sm">
            <p className="text-muted-foreground leading-relaxed">
              Los datos base de las 25 especies del compendio biológico fueron normalizados a partir del repositorio y API abierta de{" "}
              <a
                href="https://open5e.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80 font-mono"
              >
                Open5e
              </a>{" "}
              (documento <code>srd-2024</code>).
            </p>
            <div className="p-3 bg-background border border-border/70 space-y-3 font-mono text-xs">
              <div>
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">
                  Atribución exigida (texto literal en inglés):
                </p>
                <p className="italic text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
              <div className="border-t border-border/50 pt-2">
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">
                  Traducción de cortesía al español:
                </p>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pie de Página Ceremonial con Retorno */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Aethelgard: Sendas y Criaturas · Proyecto Integrador Final</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="rounded-none flex items-center gap-1.5 text-xs"
          onClick={() => {
            reproducirSonido("victoria");
            navigate("/hub");
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Regresar al Asentamiento</span>
        </Button>
      </div>
    </div>
  );
}

export default PaginaCreditos;
