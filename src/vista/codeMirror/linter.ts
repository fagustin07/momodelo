import {linter, Diagnostic} from "@codemirror/lint";
import {AnalizadorSintácticoMR} from "../../mr/analizadorSintacticoMR.ts";
import {analizarSintácticamente} from "../../ar/parserAR.ts";
import {ErrorDiagnosticable} from "../../servicios/errores.ts";

function crearDiagnosticos(texto: string, parsear: () => void): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    if (texto.trim().length === 0) return diagnostics;

    try {
        parsear();
    } catch (e) {
        const error = e as ErrorDiagnosticable;
        diagnostics.push({
            from: error.desdePosicion,
            to: error.hastaPosicion,
            severity: "error",
            message: error.message,
        });
    }

    return diagnostics;
}

export const linterMR = linter((view) => {
    const texto = view.state.doc.toString();
    return crearDiagnosticos(
        texto,
        () => new AnalizadorSintácticoMR().analizarSintaxisDe(texto),
    );
}, {delay: 500});

export const linterAR = linter((view) => {
    const texto = view.state.doc.toString();
    return crearDiagnosticos(
        texto,
        () => analizarSintácticamente(texto),
    );
}, {delay: 500});
