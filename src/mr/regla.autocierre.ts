import { EditorView } from "@codemirror/view";

const paresDeSimbolos: Record<string, string> = {
    "(": ")",
    "{": "}",
    "<": ">"
};

export const autocierre = EditorView.inputHandler.of(
    (vista, desde, hasta, texto) => {
        if (haySelección(desde, hasta)) return false;

        if (!esUnSoloCaracter(texto)) return false;

        const apertura = texto[0];
        const cierre = símboloDeCierre(apertura);
        if (cierre === undefined) return false;

        const cambios = crearCambioDeAutocierre(desde, apertura, cierre);
        const seleccion = crearSeleccionEntreSimbolos(desde);

        vista.dispatch({
            changes: cambios,
            selection: seleccion,
            userEvent: "input.type"
        });

        return true;
    }
);

function haySelección(desde: number, hasta: number): boolean {
    return desde !== hasta;
}

function esUnSoloCaracter(texto: string): boolean {
    return texto.length === 1;
}

function símboloDeCierre(símboloActual: string): string | undefined {
    return paresDeSimbolos[símboloActual];
}

function crearCambioDeAutocierre(pos: number, apertura: string, cierre: string) {
    return {
        from: pos,
        to: pos,
        insert: apertura + cierre
    };
}

function crearSeleccionEntreSimbolos(pos: number) {
    return {
        anchor: pos + 1
    };
}
