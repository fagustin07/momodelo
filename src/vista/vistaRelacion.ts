import {Relacion} from "../modelo/relacion";
import {coordenada} from "../posicion";
import {createElement, createSvgElement} from "./dom/createElement.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";
import {Entidad} from "../modelo/entidad.ts";

export class VistaRelacion extends VistaElementoMER<Relacion> {
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;

    private _rombo!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;
    private _foreignObject!: SVGForeignObjectElement;
    private _grupoElementos!: SVGGElement;

    private _ancho = 140;
    private _alto = 100;

    constructor(vistaEntidadOrigen: Entidad, vistaEntidadDestino: Entidad, relacion: Relacion, vistaEditorMER: VistaEditorMER) {
        super(relacion, vistaEditorMER);
        this._entidadOrigen = vistaEntidadOrigen;
        this._entidadDestino = vistaEntidadDestino;

        const centro = this.centro();
        this._vistaEditorMER.posicionarRelacionEn(this._relacion, centro);

        this._crearElementoDom();
        this.reposicionarRelacion();
    }

    private get _relacion() {
        return this._elemento;
    }

    representarse() {
        this._vistaEditorMER.agregarElementoSvg(
            this._lineaOrigen,
            this._lineaDestino,
            this._grupoElementos,
        );

        this._input.focus();
        this._input.select();
    }

    centro() {
        const c1 = this._vistaEditorMER.centroDeEntidad(this._entidadOrigen);
        const c2 = this._vistaEditorMER.centroDeEntidad(this._entidadDestino);
        return coordenada(
            (c1.x + c2.x) / 2,
            (c1.y + c2.y) / 2,
        );
    }

    reposicionarRelacion() {
        const c1 = this._vistaEditorMER.centroDeEntidad(this._entidadOrigen);
        const c2 = this._vistaEditorMER.centroDeEntidad(this._entidadDestino);
        const medio = this.centro().round();

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
        this._foreignObject.remove();
    }

    actualizarNombre() {
        this._input.value = this._relacion.nombre();
    }

    protected elementoDOM(): HTMLElement | SVGElement {
        return this._grupoElementos;
    }

    private _crearElementoDom() {
        this._grupoElementos = createSvgElement("g", {
            class: "relacion",
        }, [
            this._rombo = createSvgElement("polygon", {
                "pointer-events": "all",
            }),
            this._foreignObject = createSvgElement("foreignObject", {
                width: this._ancho,
                class: 'rombo-foreign-object',
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
                    oninput: () => this._actualizarInputRelacion()
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

        this._actualizarInputRelacion();
        this._input.addEventListener("input", () => {
            const nombre = this._input.value || "";
            this._vistaEditorMER.renombrarRelacion(nombre, this._relacion);
        });

        this._input.addEventListener("click", () => {
            this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion);
        });

        this._rombo.addEventListener("click", () => {
            this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion);
        });
    }

    private _actualizarInputRelacion() {
        const anchoTexto = this._medirTexto(this._input.value || "");
        const anchoFinal = Math.max(40, anchoTexto + 10);

        this._input.style.width = `${anchoFinal}px`;

        this._input.style.left = "50%";
        this._input.style.transform = "translate(-50%, -50%)";

        const nombre = this._input.value || "";
        this._vistaEditorMER.renombrarRelacion(nombre, this._relacion);

        this._ajustarRombo(anchoFinal);
    }

    private _medirTexto(texto: string): number {
        const ctx = document.createElement("canvas").getContext("2d")!;
        ctx.font = "14px sans-serif";
        return ctx.measureText(texto).width;
    }

    private _ajustarRombo(anchoTexto: number) {
        const anchoMinimo = 120;
        const anchoDeseado = anchoTexto + 60;

        const nuevoAncho = Math.max(anchoMinimo, anchoDeseado);
        const nuevoAlto = nuevoAncho * 0.7;

        if (Math.abs(nuevoAncho - this._ancho) > 1) {
            this._ancho = nuevoAncho;
            this._alto = nuevoAlto;

            this._rombo.setAttribute("points", this._getPuntosDelRombo());

            const fo = this._grupoElementos.getElementsByClassName("rombo-foreign-object")[0]!;
            fo.setAttribute("width", this._ancho.toString());
            fo.setAttribute("height",this._alto.toString());

            this.reposicionarRelacion();
        }
    }

    private _getPuntosDelRombo() {
        return [
            `${this._ancho / 2},${0}`,
            `${this._ancho},${this._alto / 2}`,
            `${this._ancho / 2},${this._alto}`,
            `${0},${this._alto / 2}`,
        ].join(" ");
    }
}
