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
    elementoRaiz.classList.add("diagrama-mer");
    elementoRaiz.appendChild(svg);

    const vistaEditorMER = new VistaEditorMER(new Modelador(entidadesEnModelo, relaciones), elementoRaiz, svg);
    const topbar = generarBarraDeInteracciones(vistaEditorMER, elementoRaiz);

    elementoRaiz.prepend(topbar);

    let posicionActualVista = coordenada(0, 0);

    function actualizarViewBoxSvg() {
        const svgBoundingBox = svg.getBoundingClientRect();
        svg.setAttribute("viewBox", `${-posicionActualVista.x} ${-posicionActualVista.y} ${svgBoundingBox.width} ${svgBoundingBox.height}`);
    }

    hacerArrastrable(svg as any, {
        alArrastrar(_posicionCursor, delta) {
            posicionActualVista = posicionActualVista.plus(delta);
            for (const elementoHijo of elementoRaiz.children) {
                if (elementoHijo instanceof HTMLElement && elementoHijo.classList.contains("entidad")) {
                    elementoHijo.style.transform = `translate(${posicionActualVista.x}px, ${posicionActualVista.y}px)`
                }
            }
            actualizarViewBoxSvg();
        }
    });

    elementoRaiz.addEventListener("click", evento => {
        if (evento.target !== elementoRaiz) return;
        if (!vistaEditorMER.puedoCrearUnaEntidad()) {
            renderizarToast(elementoRaiz, "Hacé clic en “+Entidad” y luego en el diagrama para crear Entidades.");
            return;
        }
        const posicion = coordenada(evento.offsetX, evento.offsetY);
        vistaEditorMER.solicitudCrearEntidad();
        vistaEditorMER.agregarEntidadEn(posicion, posicionActualVista);
    });

    const resizeObserver = new ResizeObserver(() => actualizarViewBoxSvg());
    resizeObserver.observe(svg);

    return vistaEditorMER;
}