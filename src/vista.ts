import {Entidad} from "./modelo/entidad.ts";
import {ModeloER} from "./servicios/modelador.ts";
import {Relacion} from "./modelo/relacion.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";

function crearElementoSvgParaRelaciones() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    return svg;
}

// ToDo: Esto debería encapsularse en el constructor de VistaEditorMER?
export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const svg = crearElementoSvgParaRelaciones();
    return new VistaEditorMER(new ModeloER(entidadesEnModelo, relaciones), elementoRaiz, svg);
}