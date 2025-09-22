import {Modelador} from "../servicios/modelador";
import {Relacion} from "../modelo/relacion";
import {coordenada} from "../posicion";
import {VistaEntidad} from "./vistaEntidad.ts";
import {createElement, createSvgElement} from "./dom/createElement.ts";

export class VistaRelacion {
    private readonly _vistaEntidadOrigen: VistaEntidad;
    private readonly _vistaEntidadDestino: VistaEntidad;
    private readonly _modelador: Modelador;
    private readonly _elementoRaiz: HTMLElement;
    private readonly _elementoSvg: SVGElement;
    private readonly _relacion: Relacion;

    private _rombo!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;

    constructor(vistaEntidadOrigen: VistaEntidad, vistaEntidadDestino: VistaEntidad, relacion: Relacion, modelador: Modelador, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        this._vistaEntidadOrigen = vistaEntidadOrigen;
        this._vistaEntidadDestino = vistaEntidadDestino;
        this._modelador = modelador;
        this._elementoRaiz = elementoRaiz;
        this._elementoSvg = elementoSvg;

        const centro = this._calcularCentro();
        this._relacion = relacion;
        this._modelador.posicionarRelacionEn(this._relacion, centro);

        this._crearElementoDom();
        this.reposicionarRelacion();
    }

    private _crearElementoDom() {
        this._rombo = createSvgElement("polygon", {
            fill: "white",
            stroke: "gray",
            'stroke-width': 1,
            'pointer-events': "all"
        });

        this._lineaOrigen = createSvgElement("line", {
            stroke: "gray",
            'stroke-width': 1,
            'pointer-events': "none"
        });

        this._lineaDestino = createSvgElement("line", {
            stroke: "gray",
            'stroke-width': 1,
            'pointer-events': "none"
        });

        this._input = createElement("input", {
            value: this._relacion.nombre(),
            title: "Nombre Relacion",
            style: {
                position: "absolute",
                width: "80px",
                border: "none",
                textAlign: "center",
                background: "transparent",
                transform: "translate(-50%, -50%)"
            }
        });

        this._input.addEventListener("input", () => {
            const nombre = this._input.value.trim() || "RELACION";
            this._modelador.renombrarRelacion(nombre, this._relacion);
        });

        this._input.addEventListener("click", () => {
            this._modelador.emitirSeleccionDeRelacion(this._relacion, this.borrarse.bind(this));
        });

        this._rombo.addEventListener("click", () => {
            this._modelador.emitirSeleccionDeRelacion(this._relacion, this.borrarse.bind(this));
        });
    }

    representarse() {
        const svg = this._elementoSvg;
        svg.appendChild(this._lineaOrigen);
        svg.appendChild(this._lineaDestino);
        svg.appendChild(this._rombo);
        this._elementoRaiz.appendChild(this._input);

        this._input.focus();
        this._input.select();
    }

    reposicionarRelacion() {
        const c1 = this._vistaEntidadOrigen.centro();
        const c2 = this._vistaEntidadDestino.centro();
        const medio = this._calcularCentro();

        this._relacion.moverseHacia(coordenada(medio.x, medio.y));

        this._lineaOrigen.setAttribute("x1", `${c1.x}`);
        this._lineaOrigen.setAttribute("y1", `${c1.y}`);
        this._lineaOrigen.setAttribute("x2", `${medio.x}`);
        this._lineaOrigen.setAttribute("y2", `${medio.y}`);

        this._lineaDestino.setAttribute("x1", `${c2.x}`);
        this._lineaDestino.setAttribute("y1", `${c2.y}`);
        this._lineaDestino.setAttribute("x2", `${medio.x}`);
        this._lineaDestino.setAttribute("y2", `${medio.y}`);

        const ancho = 200, alto = 100;
        const puntos = [
            `${medio.x},${medio.y - alto / 2}`,
            `${medio.x + ancho / 2},${medio.y}`,
            `${medio.x},${medio.y + alto / 2}`,
            `${medio.x - ancho / 2},${medio.y}`
        ].join(" ");
        this._rombo.setAttribute("points", puntos);

        this._input.style.left = `${medio.x}px`;
        this._input.style.top = `${medio.y}px`;
    }

    borrarse() {
        this._lineaOrigen.remove();
        this._lineaDestino.remove();
        this._rombo.remove();
        this._input.remove();
    }

    representaA(relacion: Relacion) {
        return this._relacion === relacion;
    }
    private _calcularCentro() {
        const c1 = this._vistaEntidadOrigen.centro();
        const c2 = this._vistaEntidadDestino.centro();
        return {
            x: (c1.x + c2.x) / 2,
            y: (c1.y + c2.y) / 2
        };
    }
}
