import { linter, Diagnostic } from "@codemirror/lint";
import { AnalizadorSintácticoMR } from "../../mr/analizadorSintacticoMR.ts";
import { ErrorSintácticoMR } from "../../servicios/errores.ts";

export const linterMR = linter((view) => {
    const texto = view.state.doc.toString();
    const diagnostics: Diagnostic[] = [];

    if (texto.trim().length === 0) return diagnostics;

    try {
        new AnalizadorSintácticoMR().analizarSintaxisDe(texto);
    } catch (e) {
        if (e instanceof ErrorSintácticoMR) {
            const linea = view.state.doc.line(e.fila);
            const desde = linea.from + e.columna - 1;
            const hasta = Math.min(desde + 1, view.state.doc.length);

            diagnostics.push({
                from: desde,
                to: hasta,
                severity: "error",
                message: e.message
            });
        }
    }

    return diagnostics;
}, { delay: 500 });