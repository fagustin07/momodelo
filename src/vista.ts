import {Entidad} from "./modelo/entidad.ts";
import {ModeloER} from "./servicios/modeloER.ts";
import {Relacion} from "./modelo/relacion.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";
import {VistaEditorMR} from "./vista/vistaEditorMR.ts";
import {createElement} from "./vista/dom/createElement.ts";
import {GestorModulos} from "./vista/gestorModulos.ts";
import {ProveedorDeTrabajo} from "./componentes/menuHamburguesa.ts";

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

    let vistaMER: VistaEditorMER;
    let vistaEditorMR: VistaEditorMR;

    const proveedorParaMER: ProveedorDeTrabajo = {
        getModeloER: () => vistaMER.modeloER,
        getTextoMR: () => vistaEditorMR.getTextoMR(),
        getTextoAR: () => vistaEditorMR.getTextoAR(),
        reemplazarModelo: (entidades, relaciones) => vistaMER.reemplazarModelo(entidades, relaciones),
        setTextoMR: (texto) => vistaEditorMR.setTextoMR(texto),
        setTextoAR: (texto) => vistaEditorMR.setTextoAR(texto),
        cancelarInteraccion: () => vistaMER.cancelarInteracción(),
        hayInteraccionEnProceso: () => vistaMER.hayUnaInteraccionEnProceso(),
    };

    const proveedorParaMR: ProveedorDeTrabajo = {
        getModeloER: () => vistaEditorMR.getModeloER(),
        getTextoMR: () => vistaEditorMR.getTextoMR(),
        getTextoAR: () => vistaEditorMR.getTextoAR(),
        reemplazarModelo: (entidades, relaciones) => vistaMER.reemplazarModelo(entidades, relaciones),
        setTextoMR: (texto) => vistaEditorMR.setTextoMR(texto),
        setTextoAR: (texto) => vistaEditorMR.setTextoAR(texto),
        cancelarInteraccion: () => {},
        hayInteraccionEnProceso: () => false,
    };

    vistaMER = new VistaEditorMER(new ModeloER(entidadesEnModelo, relaciones), elementoContenedorMER, crearElementoSvgParaRelaciones(), proveedorParaMER);
    vistaEditorMR = new VistaEditorMR(elementoContenedorMR, proveedorParaMR);

    new GestorModulos(elementoRaíz, vistaMER, vistaEditorMR);

    return vistaMER;
}