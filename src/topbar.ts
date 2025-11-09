import {createElement} from "./vista/dom/createElement.ts";
import {exportar} from "./servicios/exportador.ts";
import {importar} from "./servicios/importador.ts";
import {renderizarToast} from "./componentes/toast.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";

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

    return createElement("div", {id: "topbar"}, [
        createElement("button", botonCrearEntidad(vistaEditorMER)),
        createElement("button", botonCrearRelacion(elementoRaiz, vistaEditorMER)),
        createElement("button", botonBorrar(vistaEditorMER)),
        createElement("button", botonDeExportar(vistaEditorMER)),
        createElement("button", botonImportar(inputJson)),
        inputJson
    ]);
}

function botonCrearEntidad(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Entidad",
        onclick: () => {
            vistaEditorMER.solicitudCrearEntidad();
        }
    };
}

function botonCrearRelacion(elementoRaiz: HTMLElement, vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Relacion",
        onclick: () => {
            vistaEditorMER.solicitudCrearRelacion();
            renderizarToast(elementoRaiz, "Hacé click en las entidades de origen y destino para generar una nueva relación", {duracion: 3000});
        }
    };
}

function botonBorrar(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Borrar",
        onclick: () => {
            vistaEditorMER.solicitudDeBorrado();
        }
    };
}

function botonDeExportar(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Exportar",
        onclick: () => {
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

function botonImportar(inputJson: HTMLAnchorElement | HTMLElement | HTMLAreaElement | HTMLAudioElement | HTMLBaseElement | HTMLQuoteElement | HTMLBodyElement | HTMLBRElement | HTMLButtonElement | HTMLCanvasElement | HTMLTableCaptionElement | HTMLTableColElement | HTMLDataElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDialogElement | HTMLDivElement | HTMLDListElement | HTMLEmbedElement | HTMLFieldSetElement | HTMLFormElement | HTMLHeadingElement | HTMLHeadElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLImageElement | HTMLInputElement | HTMLLabelElement | HTMLLegendElement | HTMLLIElement | HTMLLinkElement | HTMLMapElement | HTMLMenuElement | HTMLMetaElement | HTMLMeterElement | HTMLObjectElement | HTMLOListElement | HTMLOptGroupElement | HTMLOptionElement | HTMLOutputElement | HTMLParagraphElement | HTMLPictureElement | HTMLPreElement | HTMLProgressElement | HTMLScriptElement | HTMLSelectElement | HTMLSlotElement | HTMLSourceElement | HTMLSpanElement | HTMLStyleElement | HTMLTableElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTemplateElement | HTMLTextAreaElement | HTMLTimeElement | HTMLTitleElement | HTMLTableRowElement | HTMLTrackElement | HTMLUListElement | HTMLVideoElement) {
    return {
        textContent: "Importar",
        onclick: () => inputJson.click()
    };
}
