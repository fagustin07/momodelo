import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {Modelador} from "./servicios/modelador.ts";
import {generarBarraDeInteracciones} from "./topbar.ts";
import {Relacion} from "./modelo/relacion.ts";
import {renderizarToast} from "./componentes/toast.ts";
import {hacerArrastrable} from "./arrastrable.ts";
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

// ToDo: Esto debería encapsularse en el constructor de VistaModeloManager?
export function init(elementoRaiz: HTMLElement, entidadesEnModelo: Entidad[], relaciones: Relacion[]) {
    const svg = crearElementoSvgParaRelaciones();
    elementoRaiz.appendChild(svg);

    const modelador = new Modelador(entidadesEnModelo, relaciones, elementoRaiz, svg);
    const vistaEditorMER = new VistaEditorMER(modelador);
    const topbar = generarBarraDeInteracciones(modelador, elementoRaiz);

    elementoRaiz.append(topbar);

    elementoRaiz.addEventListener("click", evento => {
        if (evento.target !== elementoRaiz) return;
        if (!modelador.puedoCrearUnaEntidad()) {
            renderizarToast(elementoRaiz, "Hacé clic en “+Entidad” y luego en el diagrama para crear Entidades.");
            return;
        }
        const posicion = coordenada(evento.offsetX, evento.offsetY);
        vistaEditorMER.solicitudCrearEntidad(posicion);
    });

    let posicionActual = coordenada(0, 0);

    function actualizarViewBoxSvg() {
        const svgBoundingBox = svg.getBoundingClientRect();
        svg.setAttribute("viewBox", `${-posicionActual.x} ${-posicionActual.y} ${svgBoundingBox.width} ${svgBoundingBox.height}`);
    }

    hacerArrastrable(svg as any, {
        alArrastrar(_posicionCursor, delta) {
            posicionActual = posicionActual.plus(delta);
            for (const elementoHijo of elementoRaiz.children) {
                if (elementoHijo instanceof HTMLElement && elementoHijo.classList.contains("entidad")) {
                    elementoHijo.style.transform = `translate(${posicionActual.x}px, ${posicionActual.y}px)`
                }
            }
            actualizarViewBoxSvg();
        }
    });

    const resizeObserver = new ResizeObserver(() => actualizarViewBoxSvg());
    resizeObserver.observe(svg);

    return vistaEditorMER;
}