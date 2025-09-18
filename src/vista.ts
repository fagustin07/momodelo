import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {Modelador} from "./servicios/modelador.ts";
import {generarBarraDeInteracciones} from "./topbar.ts";
import {Relacion} from "./modelo/relacion.ts";
import {renderizarToast} from "./componentes/toast.ts";
import {VistaEditorMER} from "./servicios/vistaEditorMER.ts";

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

// ToDo: Esto debería encapsularse en el constructor de VistaModeloManager?
export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const svg = crearElementoSvgParaRelaciones();
    document.body.appendChild(svg);

    const modelador = new Modelador(entidadesEnModelo, relaciones, elementoRaiz, svg);
    const vistaEditorMER = new VistaEditorMER(modelador, elementoRaiz, svg);
    const topbar = generarBarraDeInteracciones(modelador, elementoRaiz);

    elementoRaiz.append(topbar);

    elementoRaiz.addEventListener("click", evento => {
        if (evento.target !== elementoRaiz) return;
        if (!modelador.puedoCrearUnaEntidad()) {
            renderizarToast(elementoRaiz, "Hacé clic en “+Entidad” y luego en el diagrama para crear Entidades.");
            return;
        }
        const posicion = coordenada(evento.offsetX, evento.offsetY);
        vistaEditorMER.solicitarCreacionDeEntidad(posicion);
    });

    return modelador;
}