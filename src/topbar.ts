import {Modelador} from "./servicios/modelador.ts";
import {createElement} from "./vista/dom/createElement.ts";
import {exportar} from "./servicios/exportador.ts";
import {importar} from "./servicios/importador.ts";

export function generarBarraDeInteracciones(modelador: Modelador, elementoRaiz: HTMLElement) {
    const inputJson = createElement("input", {
        type: "file",
        accept: ".json",
        style: { display: "none" },
        onchange: async (event: Event) => {
            const input = event.target as HTMLInputElement;
            if (!input.files?.length) return;

            const file = input.files[0];
            const text = await file.text();
            const json = JSON.parse(text);

            const { entidades, relaciones } = importar(json);
            modelador.reemplazarModelo(entidades, relaciones, elementoRaiz);

            input.value = "";
        }
    });

    return createElement("div", {
        id: "topbar",
        style: {
            position: "fixed",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fafafa",
            border: "1px solid #ccc",
            borderRadius: "0 0 8px 8px",
            padding: "8px 16px",
            zIndex: "9999",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            display: "flex",
            gap: "12px"
        }
    }, [
        createElement("button", botonCrearEntidad(modelador)),
        createElement("button", botonCrearRelacion(modelador)),
        createElement("button", botonBorrar(modelador)),
        createElement("button", botonDeExportar(modelador)),
        createElement("button", botonImportar(inputJson)),
        inputJson
    ]);
}

function botonCrearEntidad(modelador: Modelador) {
    return {
        textContent: "+Entidad",
        onclick: () => {
            modelador.solicitudCrearEntidad();
        }
    };
}

function botonCrearRelacion(modelador: Modelador) {
    return {
        textContent: "+Relacion",
        onclick: () => {
            modelador.solicitudCrearRelacion();
        }
    };
}

function botonBorrar(modelador: Modelador) {
    return {
        // ToDo: debería borrar todo, no solo entidades
        textContent: "Borrar",
        onclick: () => {
            modelador.solicitudDeBorrado();
        }
    };
}

function botonDeExportar(modelador: Modelador) {
    return {
        textContent: "Exportar",
        onclick: () => {
            const json = exportar(modelador);
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
