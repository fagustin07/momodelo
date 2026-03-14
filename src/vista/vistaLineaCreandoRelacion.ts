import {coordenada, Posicion} from "../posicion.ts";
import {VistaEntidad} from "./vistaEntidad.ts";
import {createSvgElement, posicionarLinea} from "./dom/createElement.ts";

export class VistaLineaCreandoRelacion {
    private readonly _linea: SVGLineElement;
    private readonly _circulo: SVGCircleElement;
    private readonly _listenerPosiciónCursor: (e: PointerEvent) => void;
    private readonly _elementoEntidadOrigen: HTMLElement;
    private readonly _elementoRaiz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    constructor(
        vistaEntidadOrigen: VistaEntidad,
        elementoRaiz: HTMLElement,
        elementoSvg: SVGElement,
    ) {
        this._elementoRaiz = elementoRaiz;
        this._elementoSvg = elementoSvg;
        this._elementoEntidadOrigen = vistaEntidadOrigen.elementoDom();

        this._linea = this._crearLinea();
        this._circulo = this._crearCirculo();

        this._listenerPosiciónCursor = (e: PointerEvent) => {
            const posiciónCursor = this._cursorEnCoordenada(e);
            this._actualizarPosición(vistaEntidadOrigen.puntoDeConexion(posiciónCursor), posiciónCursor);
        };
    }

    representarse(): void {
        this._elementoSvg.appendChild(this._linea);
        this._elementoSvg.appendChild(this._circulo);
        this._elementoEntidadOrigen.classList.add("entidad-origen-relacion");
        this._elementoRaiz.addEventListener("pointermove", this._listenerPosiciónCursor);
    }

    borrarse(): void {
        this._linea.remove();
        this._circulo.remove();
        this._elementoEntidadOrigen.classList.remove("entidad-origen-relacion");
        this._elementoRaiz.removeEventListener("pointermove", this._listenerPosiciónCursor);
    }

    private _actualizarPosición(origen: Posicion, cursor: Posicion): void {
        posicionarLinea(this._linea, origen, cursor);
        this._circulo.setAttribute("cx", `${cursor.x}`);
        this._circulo.setAttribute("cy", `${cursor.y}`);
    }

    private _crearLinea(): SVGLineElement {
        return createSvgElement("line", {
            class: "linea-feedback",
            stroke: "#60a5fa",
            "stroke-width": 1.5,
            "pointer-events": "none",
            x1: 0, y1: 0, x2: 0, y2: 0,
        });
    }

    private _cursorEnCoordenada(evento: PointerEvent) {
        const tamañoPantallaUsuario = this._elementoSvg.getBoundingClientRect();
        return coordenada(evento.clientX - tamañoPantallaUsuario.left, evento.clientY - tamañoPantallaUsuario.top);
    }

    private _crearCirculo(): SVGCircleElement {
        return createSvgElement("circle", {
            class: "linea-feedback",
            r: 4,
            fill: "#60a5fa",
            "pointer-events": "none",
            cx: 0, cy: 0,
        });
    }
}
