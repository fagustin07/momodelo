import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {VistaAtributo} from "./vista/vistaAtributo.ts";
import {Modelador} from "./servicios/modelador.ts";
import {Atributo} from "./modelo/atributo.ts";
import {VistaEntidad} from "./vista/vistaEntidad";
import {generarBarraDeInteracciones} from "./topbar.ts";
import {Relacion} from "./modelo/relacion.ts";

export function posicionarElemento(elementoDOMEntidad: HTMLElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

export function agregarAtributoEn(contenedorAtributos: HTMLElement, atributo: Atributo, entidad: Entidad, modelador: Modelador) {
    const vistaAtributo = new VistaAtributo(atributo, modelador, entidad);
    vistaAtributo.representarseEn(contenedorAtributos);
}

export function vistaRepresentandoEntidad(contenedorEntidades: HTMLElement, entidad: Entidad, modelador: Modelador) {
    const vistaEntidad = new VistaEntidad(entidad, modelador);
    vistaEntidad.representarseEn(contenedorEntidades);
}

// ToDo: Esto debería encapsularse en un objeto?
export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const modelador = new Modelador(entidadesEnModelo);
    const topbar = generarBarraDeInteracciones(modelador, elementoRaiz);

    elementoRaiz.append(topbar);

    elementoRaiz.addEventListener("click", evento => {
        if (evento.target !== elementoRaiz) return;
        if (!modelador.puedoCrearUnaEntidad()) {
            alert("nononono!!!");
            return;
        }
        const posicion = coordenada(evento.offsetX, evento.offsetY);
        const nuevaEntidad = modelador.generarEntidadUbicadaEn(posicion);
        vistaRepresentandoEntidad(elementoRaiz, nuevaEntidad!!, modelador);
    });

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    document.body.appendChild(svg);

    modelador.entidades.forEach(entidad => {
        vistaRepresentandoEntidad(elementoRaiz, entidad, modelador);
    });
    relaciones.forEach(rel => {
        modelador.crearRelacion(rel.entidadOrigen(), rel.entidadDestino(), rel.nombre());
    })
    return modelador;
}