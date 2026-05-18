import {Entidad} from "./modelo/entidad.ts";
import {ModeloER} from "./servicios/modeloER.ts";
import {Relacion} from "./modelo/relacion.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";
import {VistaEditorMR} from "./vista/vistaEditorMR.ts";
import {createElement} from "./vista/dom/createElement.ts";
import {GestorModulos} from "./vista/gestorModulos.ts";

function crearElementoSvgParaRelaciones() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    return svg;
}

export function init(elementoRaíz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const elementoContenedorMER = createElement("section", {id: "vista-mer"});
    const elementoContenedorMR = createElement("section", {id: "vista-mr"});

    elementoRaíz.append(elementoContenedorMER);

    const vistaMER = new VistaEditorMER(new ModeloER(entidadesEnModelo, relaciones), elementoContenedorMER, crearElementoSvgParaRelaciones());
    const vistaEditorMR = new VistaEditorMR(elementoContenedorMR);

    new GestorModulos(elementoRaíz, vistaMER, vistaEditorMR);

    return vistaMER;
}