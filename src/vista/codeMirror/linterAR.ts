import {linter, Diagnostic} from "@codemirror/lint";
import {analizarSintácticamente} from "../../ar/parserAR.ts";
import {ErrorSintácticoAR} from "../../servicios/errores.ts";

export const linterAR = linter((view) => {
    const texto = view.state.doc.toString();
    const diagnostics: Diagnostic[] = [];

    if (texto.trim().length === 0) return diagnostics;

    try {
        analizarSintácticamente(texto);
    } catch (e) {
        if (e instanceof ErrorSintácticoAR) {
            diagnostics.push({
                from: e.desdePosicion,
                to: e.hastaPosicion,
                severity: "error",
                message: e.message
            });
        }
    }

    return diagnostics;
}, {delay: 500});
