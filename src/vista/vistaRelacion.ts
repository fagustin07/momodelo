import {Relacion} from "../modelo/relacion";
import {coordenada} from "../posicion";
import {VistaEntidad} from "./vistaEntidad.ts";
import {createElement, createSvgElement} from "./dom/createElement.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";

export class VistaRelacion extends VistaElementoMER<Relacion> {
    private readonly _vistaEntidadOrigen: VistaEntidad;
    private readonly _vistaEntidadDestino: VistaEntidad;
    private readonly _elementoRaiz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    private _rombo!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;
    private _grupoElementos!: SVGGElement;

    private _ancho = 200;
    private _alto = 100;

    constructor(vistaEntidadOrigen: VistaEntidad, vistaEntidadDestino: VistaEntidad, relacion: Relacion, vistaEditorMER: VistaEditorMER, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        super(relacion, vistaEditorMER);
        this._vistaEntidadOrigen = vistaEntidadOrigen;
        this._vistaEntidadDestino = vistaEntidadDestino;
        this._elementoRaiz = elementoRaiz;
        this._elementoSvg = elementoSvg;

        const centro = this._calcularCentro();
        this._vistaEditorMER.posicionarRelacionEn(this._relacion, centro);

        this._crearElementoDom();
        this.reposicionarRelacion();
    }

    private get _relacion() {
        return this._elemento;
    }

    representarse() {
        this._elementoSvg.append(
            this._lineaOrigen,
            this._lineaDestino,
            this._grupoElementos,
        );

        this._input.focus();
        this._input.select();
    }

    reposicionarRelacion() {
        const c1 = this._vistaEntidadOrigen.centro();
        const c2 = this._vistaEntidadDestino.centro();
        const medio = this._calcularCentro().round();

        this._relacion.moverseHacia(medio);

        this._lineaOrigen.setAttribute("x1", `${c1.x}`);
        this._lineaOrigen.setAttribute("y1", `${c1.y}`);
        this._lineaOrigen.setAttribute("x2", `${medio.x}`);
        this._lineaOrigen.setAttribute("y2", `${medio.y}`);

        this._lineaDestino.setAttribute("x1", `${c2.x}`);
        this._lineaDestino.setAttribute("y1", `${c2.y}`);
        this._lineaDestino.setAttribute("x2", `${medio.x}`);
        this._lineaDestino.setAttribute("y2", `${medio.y}`);

        const posicion = medio.minus(coordenada(this._ancho / 2, this._alto / 2));
        this._grupoElementos.setAttribute("transform", `translate(${posicion.x},${posicion.y})`);
    }

    borrarse() {
        this._lineaOrigen.remove();
        this._lineaDestino.remove();
        this._rombo.remove();
        this._input.remove();
    }

    actualizarNombre() {
        this._input.value = this._relacion.nombre();
    }

    private _crearElementoDom() {
        this._grupoElementos = createSvgElement("g", {}, [
            this._rombo = createSvgElement("polygon", {
                fill: "white",
                stroke: "gray",
                "stroke-width": 1,
                "pointer-events": "all",
                points: [
                    `${this._ancho / 2},${0}`,
                    `${this._ancho},${this._alto / 2}`,
                    `${this._ancho / 2},${this._alto}`,
                    `${0},${this._alto / 2}`,
                ].join(" ")
            }),
            createSvgElement("foreignObject", {
                width: this._ancho,
                height: this._alto
            }, [
                this._input = createElement("input", {
                    value: this._relacion.nombre(),
                    title: "Nombre Relacion",
                    style: {
                        position: "absolute",
                        width: "80px",
                        border: "none",
                        textAlign: "center",
                        background: "transparent",
                        transform: "translate(-50%, -50%)",
                        left: "50%",
                        top: "50%"
                    },
                })
            ])
        ]);

        this._lineaOrigen = createSvgElement("line", {
            stroke: "gray",
            "stroke-width": 1,
            "pointer-events": "none",
        });

        this._lineaDestino = createSvgElement("line", {
            stroke: "gray",
            "stroke-width": 1,
            "pointer-events": "none",
        });

        this._input.addEventListener("input", () => {
            const nombre = this._input.value.trim() || "RELACION";
            this._vistaEditorMER.renombrarRelacion(nombre, this._relacion);
        });

        this._input.addEventListener("click", () => {
            this._vistaEditorMER.emitirSeleccionDeRelacion(this._relacion);
        });

        this._rombo.addEventListener("click", () => {
            this._vistaEditorMER.emitirSeleccionDeRelacion(this._relacion);
        });
    }

    private _calcularCentro() {
        const c1 = this._vistaEntidadOrigen.centro();
        const c2 = this._vistaEntidadDestino.centro();
        return coordenada(
            (c1.x + c2.x) / 2,
            (c1.y + c2.y) / 2,
        );
    }
}
