import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {VistaAtributo} from "./vista/vistaAtributo.ts";
import {Modelador} from "./servicios/modelador.ts";
import {Atributo} from "./modelo/atributo.ts";
import {VistaEntidad} from "./vista/vistaEntidad";

export function posicionarElemento(elementoDOMEntidad: HTMLElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

export function agregarAtributoEn(contenedorAtributos: HTMLElement, atributo: Atributo, entidad: Entidad, modelador: Modelador) {
    const vistaAtributo = new VistaAtributo(atributo, modelador, entidad);
    vistaAtributo.representarseEn(contenedorAtributos);
}

function vistaRepresentandoEntidad(contenedorEntidades: HTMLElement, entidad: Entidad, modelador: Modelador) {
    const vistaEntidad = new VistaEntidad(entidad, modelador);
    vistaEntidad.representarseEn(contenedorEntidades);
}

export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[]) {
    const modelador = new Modelador(entidadesEnModelo);

    elementoRaiz.addEventListener("dblclick", evento => {
        if (evento.target !== elementoRaiz) return;

        const posicion = coordenada(evento.offsetX, evento.offsetY);
        const entidad = new Entidad("Entidad", [], posicion);
        modelador.entidades.push(entidad);

        vistaRepresentandoEntidad(elementoRaiz, entidad, modelador);

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
    return modelador;
}