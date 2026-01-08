import {Relacion} from "../modelo/relacion";
import {coordenada, Posicion} from "../posicion";
import {createElement, createSvgElement} from "./dom/createElement.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";
import {Entidad} from "../modelo/entidad.ts";
import {Cardinalidad} from "../tipos/tipos.ts";

export class VistaRelacion extends VistaElementoMER<Relacion> {
    private readonly _entidadOrigen: Entidad;
    private readonly _entidadDestino: Entidad;

    private _rombo!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;
    private _foreignObject!: SVGForeignObjectElement;
    private _grupoElementos!: SVGGElement;
    private _textoCardinalidadOrigen!: SVGTextElement;
    private _textoCardinalidadDestino!: SVGTextElement;

    private _ancho = 140;
    private _alto = 100;

    constructor(vistaEntidadOrigen: Entidad, vistaEntidadDestino: Entidad, relacion: Relacion, vistaEditorMER: VistaEditorMER) {
        super(relacion, vistaEditorMER);
        this._entidadOrigen = vistaEntidadOrigen;
        this._entidadDestino = vistaEntidadDestino;

        const centro = this.centro();
        this._vistaEditorMER.posicionarRelacionEn(this._relacion, centro);

        relacion.alCambiarCardinalidad(() => this.reposicionarRelacion());
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
            this._textoCardinalidadOrigen,
            this._textoCardinalidadDestino,
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
        const posiciónEntidadOrigen = this._vistaEditorMER.centroDeEntidad(this._entidadOrigen);
        const posiciónEntidadDestino = this._vistaEditorMER.centroDeEntidad(this._entidadDestino);
        const posiciónRelación = this.centro().round();

        this._relacion.moverseHacia(posiciónRelación);
        const posicionCardinalidadOrigen = this._calcularPuntoEntreEntidadYRelacion(posiciónEntidadOrigen, posiciónRelación);
        const posicionCardinalidadDestino = this._calcularPuntoEntreEntidadYRelacion(posiciónEntidadDestino, posiciónRelación);

        this._textoCardinalidadOrigen.setAttribute("x", `${posicionCardinalidadOrigen.x}`);
        this._textoCardinalidadOrigen.setAttribute("y", `${posicionCardinalidadOrigen.y}`);
        this._textoCardinalidadOrigen.textContent = this._formatearCardinalidad(this._relacion.cardinalidadOrigen());

        this._textoCardinalidadDestino.setAttribute("x", `${posicionCardinalidadDestino.x}`);
        this._textoCardinalidadDestino.setAttribute("y", `${posicionCardinalidadDestino.y}`);
        this._textoCardinalidadDestino.textContent = this._formatearCardinalidad(this._relacion.cardinalidadDestino());

        this._lineaOrigen.setAttribute("x1", `${posiciónEntidadOrigen.x}`);
        this._lineaOrigen.setAttribute("y1", `${posiciónEntidadOrigen.y}`);
        this._lineaOrigen.setAttribute("x2", `${posiciónRelación.x}`);
        this._lineaOrigen.setAttribute("y2", `${posiciónRelación.y}`);

        this._lineaDestino.setAttribute("x1", `${posiciónEntidadDestino.x}`);
        this._lineaDestino.setAttribute("y1", `${posiciónEntidadDestino.y}`);
        this._lineaDestino.setAttribute("x2", `${posiciónRelación.x}`);
        this._lineaDestino.setAttribute("y2", `${posiciónRelación.y}`);

        const posicion = posiciónRelación.minus(coordenada(this._ancho / 2, this._alto / 2));
        this._grupoElementos.setAttribute("transform", `translate(${posicion.x},${posicion.y})`);
    }

    borrarse() {
        this._lineaOrigen.remove();
        this._lineaDestino.remove();
        this._rombo.remove();
        this._input.remove();
        this._textoCardinalidadOrigen.remove();
        this._textoCardinalidadDestino.remove();
        this._foreignObject.remove();
    }

    actualizarNombre() {
        this._input.value = this._relacion.nombre();
        this._actualizarInputRelacion();
    }

    protected elementoDOM(): HTMLElement | SVGElement {
        return this._grupoElementos;
    }

    private _crearElementoDom() {
        this._textoCardinalidadOrigen = createSvgElement("text", {
            class: "cardinalidad-texto",
        });

        this._textoCardinalidadDestino = createSvgElement("text", {
            class: "cardinalidad-texto",
        });

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
                    oninput: () => this._actualizarInputRelacionNotificando()
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

        this._actualizarInputRelacionNotificando();
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

        this._ajustarRombo(anchoFinal);
    }

    private _actualizarInputRelacionNotificando() {
        this._actualizarInputRelacion();
        this._vistaEditorMER.renombrarRelacion(this._input.value || "", this._relacion);
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
            fo.setAttribute("height", this._alto.toString());

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

    private _formatearCardinalidad(cardinalidad: Cardinalidad): string {
        return `(${cardinalidad[0]}, ${cardinalidad[1]})`;
    }

    private _calcularPuntoEntreEntidadYRelacion(coordenadaEntidad: Posicion, coordenadaRelación: Posicion): Posicion {
        const delta = 0.4;
        return coordenada(
            coordenadaEntidad.x + (coordenadaRelación.x - coordenadaEntidad.x) * delta,
            coordenadaEntidad.y + (coordenadaRelación.y - coordenadaEntidad.y) * delta - 10
        )
    };

}
