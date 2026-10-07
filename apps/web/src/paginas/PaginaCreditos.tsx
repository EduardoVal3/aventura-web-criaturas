import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";

export function PaginaCreditos() {
  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto overflow-x-hidden">
      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold retro tracking-tight text-primary">
          Créditos y licencias
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Reconocimiento de software de código abierto y fuentes de datos utilizadas en Aethelgard.
        </p>
      </header>

      {/* Sistema de diseño retro: 8bitcn/ui */}
      <section className="space-y-4" aria-labelledby="seccion-8bitcn">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle id="seccion-8bitcn">Sistema de diseño: 8bitcn/ui</CardTitle>
              <Badge variant="secondary">Licencia MIT</Badge>
            </div>
            <CardDescription>
              Colección de componentes retro estilizados para React y Tailwind CSS v4.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm">
            <p>
              Los componentes visuales retro utilizados en este proyecto provienen de{" "}
              <a
                href="https://github.com/TheOrcDev/8bitcn-ui"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80"
              >
                8bitcn/ui (TheOrcDev/8bitcn-ui)
              </a>
              , distribuidos bajo la Licencia MIT.
            </p>
            <div className="p-4 bg-muted/50 border border-border rounded font-mono text-xs whitespace-pre-wrap leading-relaxed">
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

      {/* Fuente de criaturas: Open5e y Wizards of the Coast */}
      <section className="space-y-4" aria-labelledby="seccion-open5e">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle id="seccion-open5e">Catálogo de criaturas: Open5e y SRD 5.2</CardTitle>
              <Badge>CC BY 4.0</Badge>
            </div>
            <CardDescription>
              Datos estadísticos y criaturas fantásticas importadas de la API de Open5e.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm">
            <p>
              Los datos base de las 25 especies del catálogo de criaturas fueron obtenidos mediante la API de{" "}
              <a
                href="https://open5e.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80"
              >
                Open5e
              </a>{" "}
              (documento <code>srd-2024</code>).
            </p>
            <div className="p-4 bg-muted/50 border border-border rounded space-y-3">
              <div>
                <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                  Atribución exigida (texto literal en inglés):
                </p>
                <p className="italic text-muted-foreground mt-1 text-xs">
                  "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                  Traducción de cortesía:
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default PaginaCreditos;
