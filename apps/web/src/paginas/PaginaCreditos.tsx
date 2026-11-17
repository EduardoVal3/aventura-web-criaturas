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
    if (celebrando) return;
    setCelebrando(true);
    reproducirSonido("fanfarria");
    setTimeout(() => {
      setCelebrando(false);
    }, 1200);
  };

  const criaturasEmblematicas = [
    {
      slug: "lobo-estepario",
      nombre: "Lobo Estepario",
      tipo: "Bestia",
      zona: "Praderas",
      legendaria: false,
    },
    {
      slug: "golem-granito",
      nombre: "Golem Granito",
      tipo: "Constructo",
      zona: "Riscos",
      legendaria: false,
    },
    {
      slug: "quimera-tricefala",
      nombre: "Quimera Tricéfala",
      tipo: "Monstruosidad",
      zona: "Abismo",
      legendaria: false,
    },
    {
      slug: "remorhaz-glaciar",
      nombre: "Remorhaz Glaciar",
      tipo: "Monstruosidad",
      zona: "Glaciar",
      legendaria: true,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 space-y-6 sm:space-y-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Cabecera Ceremonial: Salón de la Fama / Ending RPG Retro Brutalist */}
      <div className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-bastion p-4 sm:p-6 rounded-none space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-500/20 text-amber-400 border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2.5 py-1 rounded-none flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>SALÓN DE LA FAMA</span>
              </Badge>
              <Badge variant="secondary" className="border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2.5 py-1 rounded-none flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>ISC-305 · III PAC 2026</span>
              </Badge>
            </div>
            <h1 className="retro text-base sm:text-xl md:text-2xl font-bold tracking-tight text-primary drop-shadow-[2px_2px_0_#000] break-words leading-snug">
              AETHELGARD: CRÉDITOS Y HONOR
            </h1>
            <p className="retro text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed break-words">
              Conclusión del desarrollo full-stack, homenajes académicos y licencias abiertas.
            </p>
          </div>

          {/* Botones de Cabecera con Separación Holgada y Relieve Táctil */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-4 flex-wrap w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto justify-center retro text-[8px] sm:text-[9px] font-bold rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] bg-amber-500 hover:bg-amber-400 text-black px-4 py-3 h-auto flex items-center gap-2 cursor-pointer transition-all"
              onClick={festejarFanfarria}
              disabled={celebrando}
              aria-busy={celebrando}
            >
              <Volume2 className={`w-3.5 h-3.5 shrink-0 ${celebrando ? "animate-bounce" : ""}`} aria-hidden="true" />
              <span>{celebrando ? "CELEBRANDO..." : "CELEBRAR FANFARRIA"}</span>
            </Button>

            <Button
              id="boton-volver-inicio-creditos"
              data-testid="boton-volver-inicio-creditos"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto justify-center retro text-[8px] sm:text-[9px] font-bold rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] bg-bastion hover:bg-panel text-foreground px-4 py-3 h-auto flex items-center gap-2 cursor-pointer transition-all"
              onClick={() => {
                reproducirSonido("victoria");
                navigate("/hub");
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Volver al Asentamiento</span>
            </Button>
          </div>
        </div>

        {/* Galería Decorativa de Criaturas Emblemáticas Canónicas (Rediseño Vitrina 8-Bit) */}
        <div className="pt-6 border-t-2 border-black/80 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="retro text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
              Bestiario Victorioso de Aethelgard
            </span>
            <span className="retro text-[7px] text-muted-foreground uppercase">
              Especies Canónicas del Compendio
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {criaturasEmblematicas.map((criatura) => (
              <div
                key={criatura.slug}
                className="bg-abismo/95 border-2 border-black shadow-[3px_3px_0_0_#000] p-3 rounded-none flex flex-col items-center text-center justify-between gap-2.5 relative group hover:border-primary/80 transition-all min-w-0"
              >
                {criatura.legendaria && (
                  <span className="absolute -top-2 right-2 bg-amber-400 text-black border border-black shadow-[1px_1px_0_0_#000] retro text-[7px] font-bold px-1.5 py-0.5 z-10">
                    LEGENDARIA
                  </span>
                )}

                {/* Pedestal de Sprite Pixel-Art Centrado */}
                <div className="w-16 h-16 bg-bastion border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.7)] flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={obtenerImagenCriatura(criatura.slug)}
                    alt={criatura.nombre}
                    onError={(e) => manejarErrorImagen(e, "criatura")}
                    className="pixelated h-12 w-12 object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Identificación y Atributos con Envoltura Limpia */}
                <div className="w-full space-y-1.5 flex-1 flex flex-col justify-center">
                  <span className="retro text-[8px] sm:text-[9px] font-bold text-foreground block leading-snug break-words">
                    {criatura.nombre}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <span className="retro text-[7px] uppercase px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] bg-black/60 text-amber-300">
                      {criatura.tipo}
                    </span>
                    <span className="retro text-[7px] uppercase px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] bg-primary/20 text-primary">
                      {criatura.zona}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Homenaje Académico: Profesor / Ingeniero Claudio */}
      <section aria-labelledby="homenaje-claudio">
        <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" aria-hidden="true" />
                <CardTitle id="homenaje-claudio" className="retro text-xs sm:text-sm text-primary tracking-tight leading-snug break-words">
                  Homenaje Académico — Ingeniero Claudio
                </CardTitle>
              </div>
              <Badge className="bg-primary/20 text-primary border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2 py-0.5 rounded-none">
                ISC-305 PROGRAMACIÓN WEB
              </Badge>
            </div>
            <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground mt-1 leading-relaxed break-words">
              Cátedra de Programación Web y Arquitectura de Sistemas de Información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3.5 retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
            <p>
              Dedicamos este proyecto al <strong className="text-foreground font-bold">Ingeniero Claudio</strong> en agradecimiento por su exigencia metodológica y su visión docente en la asignatura <strong className="text-foreground font-bold">ISC-305 Programación Web</strong>. Su énfasis constante en el rigor arquitectónico, la eliminación de antipatrones como las ráfagas N+1, la validación estricta en servidor y la trazabilidad documental impulsó cada decisión técnica detrás de <em>Aethelgard: Sendas y Criaturas</em>.
            </p>
            <div className="p-3 sm:p-4 bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold retro text-[8px] sm:text-[9px]">
                <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Principios Rectores Aplicados:</span>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed break-words">
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
        <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" aria-hidden="true" />
                <CardTitle id="equipo-desarrollo" className="retro text-xs sm:text-sm text-foreground tracking-tight leading-snug break-words">
                  Equipo de Desarrollo y Arquitectura
                </CardTitle>
              </div>
              <Badge variant="outline" className="border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2 py-0.5 rounded-none bg-secondary text-secondary-foreground">
                AV5 · FASE 10
              </Badge>
            </div>
            <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground mt-1 leading-relaxed break-words">
              Ingeniería de software, diseño de mecánicas RPG y experiencia retro 16-bit
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3.5 retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
            <p>
              El proyecto <em>Aethelgard: Sendas y Criaturas</em> fue concebido como un juego de rol y estrategia web que revive la era dorada de los videojuegos de 8 y 16 bits, combinando estándares contemporáneos de seguridad (S-1 a S-7) e invariantes de negocio inquebrantables (INV-01 a INV-05).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              <div className="p-3 bg-black/40 border-2 border-black shadow-[2px_2px_0_0_#000] space-y-1">
                <span className="retro text-[8px] text-amber-400 block uppercase font-bold tracking-wider">Front-End</span>
                <span className="retro text-[9px] sm:text-[10px] text-foreground font-bold block leading-snug break-words">React 19 + Vite</span>
                <p className="retro text-[8px] text-muted-foreground mt-1 leading-relaxed break-words">Tailwind CSS v4 & 8bitcn/ui</p>
              </div>
              <div className="p-3 bg-black/40 border-2 border-black shadow-[2px_2px_0_0_#000] space-y-1">
                <span className="retro text-[8px] text-amber-400 block uppercase font-bold tracking-wider">Back-End</span>
                <span className="retro text-[9px] sm:text-[10px] text-foreground font-bold block leading-snug break-words">NestJS 11 + Prisma</span>
                <p className="retro text-[8px] text-muted-foreground mt-1 leading-relaxed break-words">PostgreSQL & Swagger OpenAPI</p>
              </div>
              <div className="p-3 bg-black/40 border-2 border-black shadow-[2px_2px_0_0_#000] space-y-1">
                <span className="retro text-[8px] text-amber-400 block uppercase font-bold tracking-wider">Audio & Assets</span>
                <span className="retro text-[9px] sm:text-[10px] text-foreground font-bold block leading-snug break-words">Web Audio API</span>
                <p className="retro text-[8px] text-muted-foreground mt-1 leading-relaxed break-words">Síntesis retro nativa 8-bit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sistema de diseño retro: 8bitcn/ui y Motor de Audio */}
      <section className="space-y-4" aria-labelledby="seccion-8bitcn">
        <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" aria-hidden="true" />
                <CardTitle id="seccion-8bitcn" className="retro text-xs sm:text-sm text-foreground tracking-tight leading-snug break-words">
                  Sistema de Diseño 8bitcn/ui y Audio Web Audio API
                </CardTitle>
              </div>
              <Badge variant="secondary" className="border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2 py-0.5 rounded-none">
                Licencia MIT
              </Badge>
            </div>
            <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground mt-1 leading-relaxed break-words">
              Componentes de interfaz nostálgicos para React y sintetizador por software
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3.5 retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
            <p>
              Los componentes visuales retro utilizados en este proyecto provienen de{" "}
              <a
                href="https://github.com/TheOrcDev/8bitcn-ui"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80 break-all"
              >
                8bitcn/ui (TheOrcDev/8bitcn-ui)
              </a>
              , distribuidos bajo la Licencia MIT. El subsistema de audio opera mediante síntesis de ondas cuadradas y diente de sierra a través de la API estándar Web Audio sin dependencias pesadas de audio externas.
            </p>
            <div className="p-3 bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] retro text-[8px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto overflow-x-hidden text-muted-foreground select-all break-words">
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
        <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-card rounded-none">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" aria-hidden="true" />
                <CardTitle id="seccion-open5e" className="retro text-xs sm:text-sm text-foreground tracking-tight leading-snug break-words">
                  Catálogo de Criaturas: Open5e y SRD 5.2
                </CardTitle>
              </div>
              <Badge className="border-2 border-black shadow-[2px_2px_0_0_#000] retro text-[8px] sm:text-[9px] px-2 py-0.5 rounded-none bg-primary/20 text-primary">
                CC BY 4.0
              </Badge>
            </div>
            <CardDescription className="retro text-[8px] sm:text-[9px] text-muted-foreground mt-1 leading-relaxed break-words">
              Datos estadísticos y criaturas fantásticas del System Reference Document 5.2
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-3.5 retro text-[8px] sm:text-[9px] leading-relaxed text-muted-foreground break-words">
            <p>
              Los datos base de las 25 especies del compendio biológico fueron normalizados a partir del repositorio y API abierta de{" "}
              <a
                href="https://open5e.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80 break-all"
              >
                Open5e
              </a>{" "}
              (documento <code className="bg-black/50 px-1 py-0.5 border border-black text-foreground">srd-2024</code>).
            </p>
            <div className="p-3 sm:p-4 bg-black/40 border-2 border-black shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)] space-y-3 overflow-x-hidden break-words">
              <div>
                <p className="font-bold text-foreground text-[8px] sm:text-[9px] uppercase tracking-wide">
                  Atribución exigida (texto literal en inglés):
                </p>
                <p className="italic text-muted-foreground mt-1 text-[8px] leading-relaxed break-words">
                  "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
              <div className="border-t-2 border-black/60 pt-3">
                <p className="font-bold text-foreground text-[8px] sm:text-[9px] uppercase tracking-wide">
                  Traducción de cortesía al español:
                </p>
                <p className="text-muted-foreground mt-1 text-[8px] leading-relaxed break-words">
                  "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pie de Página Ceremonial con Retorno y Separación Amplia */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t-2 border-black">
        <div className="flex items-center gap-2 retro text-[8px] sm:text-[9px] text-muted-foreground text-center sm:text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">Aethelgard: Sendas y Criaturas · Proyecto Integrador Final</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto justify-center retro text-[8px] sm:text-[9px] font-bold rounded-none border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none hover:shadow-[4px_4px_0_0_#000] bg-bastion hover:bg-panel text-foreground px-5 py-3 h-auto flex items-center gap-2 cursor-pointer transition-all shrink-0"
          onClick={() => {
            reproducirSonido("victoria");
            navigate("/hub");
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Regresar al Asentamiento</span>
        </Button>
      </div>
    </div>
  );
}

export default PaginaCreditos;
