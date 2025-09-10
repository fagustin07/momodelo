import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {VistaAtributo} from "./vista/vistaAtributo.ts";
import {Modelador} from "./servicios/modelador.ts";
import {Atributo} from "./modelo/atributo.ts";
import {VistaEntidad} from "./vista/vistaEntidad";
import {generarBarraDeInteracciones} from "./topbar.ts";
import {Relacion} from "./modelo/relacion.ts";
import {renderizarToast} from "./componentes/toast.ts";

export function posicionarElemento(elementoDOMEntidad: HTMLElement, entidad: Entidad) {
    elementoDOMEntidad.style.translate = `${entidad.posicion().x}px ${entidad.posicion().y}px`;
}

export function agregarAtributoEn(contenedorAtributos: HTMLElement, atributo: Atributo, entidad: Entidad, modelador: Modelador) {
    const vistaAtributo = new VistaAtributo(atributo, modelador, entidad);
    vistaAtributo.representarseEn(contenedorAtributos);
}

function crearElementoSvgParaRelaciones() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    return svg;
}

// ToDo: Esto debería encapsularse en un objeto?
export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const svg = crearElementoSvgParaRelaciones();
    document.body.appendChild(svg);

    const modelador = new Modelador(entidadesEnModelo, relaciones, elementoRaiz, svg);
    const topbar = generarBarraDeInteracciones(modelador, elementoRaiz);

    elementoRaiz.append(topbar);

    elementoRaiz.addEventListener("click", evento => {
        if (evento.target !== elementoRaiz) return;
        if (!modelador.puedoCrearUnaEntidad()) {
            renderizarToast(elementoRaiz, "Hacé clic en “+Entidad” y luego en el diagrama para crear Entidades.");
            return;
        }
        const posicion = coordenada(evento.offsetX, evento.offsetY);
        modelador.generarEntidadUbicadaEn(posicion);
    });

    return modelador;
}