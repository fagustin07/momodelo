import {createElement} from "./vista/dom/createElement.ts";
import {exportar} from "./servicios/exportador.ts";
import {importar} from "./servicios/importador.ts";
import {renderizarToast} from "./componentes/toast.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";

let botonActivo: HTMLButtonElement | null = null;

export function generarBarraDeInteracciones(vistaEditorMER: VistaEditorMER, elementoRaiz: HTMLElement) {
    const inputJson = createElement("input", {
        type: "file",
        accept: ".json",
        style: {display: "none"},
        onchange: async (event: Event) => {
            const input = event.target as HTMLInputElement;
            if (!input.files?.length) return;

            const file = input.files[0];
            const text = await file.text();
            const json = JSON.parse(text);

            const {entidades, relaciones} = importar(json);
            vistaEditorMER.reemplazarModelo(entidades, relaciones);

            input.value = "";
        }
    });

    elementoRaiz.addEventListener("fin-interaccion-mer", () => {
        if (botonActivo !== null) {
            botonActivo.classList.remove("boton-activo");
            botonActivo = null;

            if (document.activeElement instanceof HTMLButtonElement) {
                document.activeElement.blur();
            }
        }
    });

    return createElement("div", {id: "topbar"}, [
        createElement("button", botonCrearEntidad(vistaEditorMER)),
        createElement("button", botonCrearRelacion(elementoRaiz, vistaEditorMER)),
        createElement("button", botonBorrar(vistaEditorMER)),
        createElement("button", botonDeExportar(vistaEditorMER)),
        createElement("button", botonImportar(inputJson, vistaEditorMER)),
        inputJson
    ]);
}

function handlearBotonPresionado(boton: HTMLButtonElement, vistaEditorMER: VistaEditorMER, callbackAlPresionarBotonn: () => void) {
    if (botonActivo === boton) {
        boton.classList.remove("boton-activo");
        vistaEditorMER.cancelarInteracción();
        botonActivo = null;
        return;
    }

    if (botonActivo) botonActivo.classList.remove("boton-activo");

    vistaEditorMER.cancelarInteracción();

    boton.classList.add("boton-activo");
    botonActivo = boton;
    callbackAlPresionarBotonn();
}

function resetearInteracciones(vistaEditorMER: VistaEditorMER) {
}

function botonCrearEntidad(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Entidad",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER,
                () => vistaEditorMER.solicitudCrearEntidad(),
            ),
    };
}

function botonCrearRelacion(elementoRaiz: HTMLElement, vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Relacion",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER, () => {
                vistaEditorMER.solicitudCrearRelacion();
                renderizarToast(
                    elementoRaiz,
                    "Hacé click en las entidades de origen y destino para generar una nueva relación",
                    { duracion: 3000 }
                );
            }),
    };
}

function botonBorrar(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Borrar",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER, () =>
                vistaEditorMER.solicitudDeBorrado()
            ),
    };
}

function botonDeExportar(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Exportar",
        onclick: () => {
            vistaEditorMER.cancelarInteracción();
            const json = exportar(vistaEditorMER.modelador);
            const blob = new Blob([JSON.stringify(json, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString()
                .replace(/T/, "_")
                .replace(/:/g, "-")
                .replace(/\..+/, "");

            const nombreSugerido = `MER_${timestamp}`;
            const nombreSinExtension = prompt("Elegí el nombre del archivo:", nombreSugerido);

            if (!nombreSinExtension) return;

            const a = document.createElement("a");
            a.href = url;
            a.download = `${nombreSinExtension}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
}

function botonImportar(inputJson: HTMLInputElement, vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Importar",
        onclick: () => {
            vistaEditorMER.cancelarInteracción();
            inputJson.click();
        }
    };
}
