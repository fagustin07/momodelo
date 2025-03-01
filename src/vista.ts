import {Entidad} from "./modelo/entidad.ts";
import {hacerArrastrable} from "./arrastrable.ts";
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

    // VISTA MODELO
    elementoRaiz.addEventListener("dblclick", evento => {
        if (evento.target !== elementoRaiz) return;

        const posicion = coordenada(evento.offsetX, evento.offsetY);
        const entidad = new Entidad("Entidad", [], posicion);
        modelador.entidades.push(entidad);

        vistaRepresentandoEntidad(elementoRaiz, entidad, modelador);

        console.log(entidad);
    });

    modelador.entidades.forEach(entidad => {
        vistaRepresentandoEntidad(elementoRaiz, entidad, modelador);
    });
}