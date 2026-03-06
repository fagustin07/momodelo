import {Relacion} from "../modelo/relacion";
import {coordenada, Posicion, puntoMedio} from "../posicion";
import {createElement, createSvgElement} from "./dom/createElement.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";
import {VistaEntidad} from "./vistaEntidad.ts";
import {Cardinalidad} from "../tipos/tipos.ts";

export class VistaRelacion extends VistaElementoMER<Relacion> {
    private readonly _vistaEntidadOrigen: VistaEntidad;
    private readonly _vistaEntidadDestino: VistaEntidad;

    private _rombo!: SVGPolygonElement;
    private _romboInterior!: SVGPolygonElement;
    private _lineaOrigen!: SVGLineElement;
    private _lineaOrigenInterior!: SVGLineElement;
    private _lineaDestino!: SVGLineElement;
    private _input!: HTMLInputElement;
    private _foreignObject!: SVGForeignObjectElement;
    private _grupoElementos!: SVGGElement;
    private _textoCardinalidadOrigen!: SVGTextElement;
    private _textoCardinalidadDestino!: SVGTextElement;

    private _ancho = 140;
    private _alto = 100;

    constructor(vistaEntidadOrigen: VistaEntidad, vistaEntidadDestino: VistaEntidad, relacion: Relacion, vistaEditorMER: VistaEditorMER) {
        super(relacion, vistaEditorMER);
        this._vistaEntidadOrigen = vistaEntidadOrigen;
        this._vistaEntidadDestino = vistaEntidadDestino;

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
            this._lineaOrigenInterior,
            this._lineaDestino,
            this._textoCardinalidadOrigen,
            this._textoCardinalidadDestino,
            this._grupoElementos,
        );

        this._input.focus();
        this._input.select();
    }

    centro() {
        return puntoMedio(
            this._vistaEntidadOrigen.centro(),
            this._vistaEntidadDestino.centro(),
        );
    }

    puntoDeConexion(puntoExterno: Posicion): Posicion {
        return this._calcularPuntoDeConexion(this.centro(), puntoExterno);
    }

    reposicionarRelacion() {
        const posiciónRelación = this.centro().round();

        this._reposicionarParticipaciónDeEntidades(posiciónRelación);
        this._actualizarEstilosSegunTipo();
        this._relacion.moverseHacia(posiciónRelación);

        const posicion = posiciónRelación.minus(coordenada(this._ancho / 2, this._alto / 2));
        this._grupoElementos.setAttribute("transform", `translate(${posicion.x},${posicion.y})`);
    }

    private _actualizarEstilosSegunTipo() {
        const esDebil = this._relacion.esDebil();

        this._lineaOrigen.setAttribute("stroke-width", esDebil ? "5" : "1");
        this._lineaOrigenInterior.setAttribute("stroke-width", esDebil ? "2" : "0");

        if (esDebil) {
            this._grupoElementos.insertBefore(this._romboInterior, this._rombo.nextSibling);
            this._romboInterior.setAttribute("points", this._getPuntosDelRomboInterior());
        } else {
            this._romboInterior.remove();
        }
    }

    borrarse() {
        this._lineaOrigen.remove();
        this._lineaOrigenInterior.remove();
        this._lineaDestino.remove();
        this._grupoElementos.remove();
        this._textoCardinalidadOrigen.remove();
        this._textoCardinalidadDestino.remove();
    }

    actualizarNombre() {
        this._input.value = this._relacion.nombre();
        this._actualizarInputRelacion();
    }

    protected elementoDOM(): HTMLElement | SVGElement {
        return this._grupoElementos;
    }

    private _crearElementoDom() {
        this._dibujarElementosDeRelación();
        this._dibujarParticipaciónDeEntidades();

        this._actualizarInputRelacionNotificando();
        this._agregarEventListenersDeElementos();

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
            if (this._relacion.esDebil()) {
                this._romboInterior.setAttribute("points", this._getPuntosDelRomboInterior());
            }

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

    private _getPuntosDelRomboInterior() {
        const margen = 5;
        return [
            `${this._ancho / 2},${margen}`,
            `${this._ancho - margen},${this._alto / 2}`,
            `${this._ancho / 2},${this._alto - margen}`,
            `${margen},${this._alto / 2}`,
        ].join(" ");
    }

    private _formatearCardinalidad(cardinalidad: Cardinalidad): string {
        return `(${cardinalidad[0]}, ${cardinalidad[1]})`;
    }


    private _dibujarElementosDeRelación() {
        this._romboInterior = createSvgElement("polygon", {
            "pointer-events": "none",
            fill: "white",
            stroke: "gray",
            "stroke-width": 1,
        });

        this._grupoElementos = createSvgElement("g", {
            class: "relacion",
        }, [
            this._rombo = createSvgElement("polygon", {
                "pointer-events": "all",
                fill: "white",
                stroke: "gray",
                "stroke-width": 1,
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

        if (this._relacion.esDebil()) {
            this._grupoElementos.insertBefore(this._romboInterior, this._foreignObject);
        }
    }

    private _dibujarParticipaciónDeEntidades() {
        const esDebil = this._relacion.esDebil();

        this._lineaOrigen = createSvgElement("line", {
            stroke: "gray",
            "stroke-width": esDebil ? 5 : 1,
            "pointer-events": "none",
        });

        this._lineaOrigenInterior = createSvgElement("line", {
            stroke: "white",
            "stroke-width": esDebil ? 2 : 0,
            "pointer-events": "none",
        });

        this._lineaDestino = createSvgElement("line", {
            stroke: "gray",
            "stroke-width": 1,
            "pointer-events": "none",
        });

        this._textoCardinalidadOrigen = createSvgElement("text", {
            class: "cardinalidad-texto",
        });

        this._textoCardinalidadDestino = createSvgElement("text", {
            class: "cardinalidad-texto",
        });
    }

    private _agregarEventListenersDeElementos() {
        this._input.addEventListener("input", () => {
            const nombre = this._input.value || "";
            this._vistaEditorMER.renombrarRelacion(nombre, this._relacion);
        });

        this._input.addEventListener("click", () =>
            this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion));

        this._rombo.addEventListener("click", () =>
            this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion));

        this._textoCardinalidadOrigen.addEventListener("click",
            () => this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion));

        this._textoCardinalidadDestino.addEventListener("click",
            () => this._vistaEditorMER.emitirSeleccionDeRelación(this._relacion));
    }

    private _reposicionarParticipaciónDeEntidades(posiciónRelación: Posicion) {
        const centroOrigen = this._vistaEntidadOrigen.centro();
        const centroDestino = this._vistaEntidadDestino.centro();

        const bordeOrigen = this._vistaEntidadOrigen.puntoDeConexion(posiciónRelación);
        const bordeRomboOrigen = this.puntoDeConexion(centroOrigen);

        const bordeDestino = this._vistaEntidadDestino.puntoDeConexion(posiciónRelación);
        const bordeRomboDestino = this.puntoDeConexion(centroDestino);

        this._reposicionarLinea(this._lineaOrigen, bordeOrigen, bordeRomboOrigen);
        this._reposicionarLinea(this._lineaOrigenInterior, bordeOrigen, bordeRomboOrigen);
        this._reposicionarLinea(this._lineaDestino, bordeDestino, bordeRomboDestino);

        this._redibujarTexto(
            this._textoCardinalidadOrigen,
            puntoMedio(bordeOrigen, bordeRomboOrigen),
            this._formatearCardinalidad(this._relacion.cardinalidadDestino()),
        );
        this._redibujarTexto(
            this._textoCardinalidadDestino,
            puntoMedio(bordeDestino, bordeRomboDestino),
            this._formatearCardinalidad(this._relacion.cardinalidadOrigen()),
        );
    }

    private _calcularPuntoDeConexion(centroRelacion: Posicion, ubicacionObjetivo: Posicion): Posicion {
        const mitadAnchoDelRombo = this._ancho / 2;
        const mitadAltoDelRombo = this._alto / 2;

        const verticeSuperior = coordenada(centroRelacion.x, centroRelacion.y - mitadAltoDelRombo);
        const verticeDerecho = coordenada(centroRelacion.x + mitadAnchoDelRombo, centroRelacion.y);
        const verticeInferior = coordenada(centroRelacion.x, centroRelacion.y + mitadAltoDelRombo);
        const verticeIzquierdo = coordenada(centroRelacion.x - mitadAnchoDelRombo, centroRelacion.y);

        const elObjetivoEstaALaDerecha = ubicacionObjetivo.x >= centroRelacion.x;
        const elObjetivoEstaAbajo = ubicacionObjetivo.y >= centroRelacion.y;

        if (elObjetivoEstaALaDerecha && !elObjetivoEstaAbajo)
            return this._calcularInterseccionConLado(centroRelacion, ubicacionObjetivo, verticeSuperior, verticeDerecho);
        if (elObjetivoEstaALaDerecha && elObjetivoEstaAbajo)
            return this._calcularInterseccionConLado(centroRelacion, ubicacionObjetivo, verticeDerecho, verticeInferior);
        if (!elObjetivoEstaALaDerecha && elObjetivoEstaAbajo)
            return this._calcularInterseccionConLado(centroRelacion, ubicacionObjetivo, verticeInferior, verticeIzquierdo);

        return this._calcularInterseccionConLado(centroRelacion, ubicacionObjetivo, verticeIzquierdo, verticeSuperior);
    }

    private _interpolarPunto(p0: Posicion, p1: Posicion, factor: number): Posicion {
        return coordenada(
            p0.x + factor * (p1.x - p0.x),
            p0.y + factor * (p1.y - p0.y),
        );
    }

    private _calcularInterseccionConLado(centroRelacion: Posicion, ubicacionObjetivo: Posicion, verticeA: Posicion, verticeB: Posicion): Posicion {
        const magnitudXDeseada = ubicacionObjetivo.x - centroRelacion.x;
        const magnitudYDeseada = ubicacionObjetivo.y - centroRelacion.y;
        const magnitudXLateralDelRombo = verticeB.x - verticeA.x;
        const magnitudYLateralDelRombo = verticeB.y - verticeA.y;

        const productoVectorialCruzado = magnitudXDeseada * magnitudYLateralDelRombo - magnitudYDeseada * magnitudXLateralDelRombo;

        const factorDistanciaHaciaElObjetivo =
            ((verticeA.x - centroRelacion.x) * magnitudYLateralDelRombo -
                (verticeA.y - centroRelacion.y) * magnitudXLateralDelRombo) / productoVectorialCruzado;

        return this._interpolarPunto(centroRelacion, ubicacionObjetivo, factorDistanciaHaciaElObjetivo);
    }

    private _redibujarTexto(elementoTexto: SVGTextElement, posicionCardinalidadDestino: Posicion, texto: string) {
        elementoTexto.setAttribute("x", `${posicionCardinalidadDestino.x}`);
        elementoTexto.setAttribute("y", `${posicionCardinalidadDestino.y}`);
        elementoTexto.textContent = texto;
    }

    private _reposicionarLinea(linea: SVGLineElement, posicionOrigen: Posicion, posicionDestino: Posicion) {
        linea.setAttribute("x1", `${posicionOrigen.x}`);
        linea.setAttribute("y1", `${posicionOrigen.y}`);
        linea.setAttribute("x2", `${posicionDestino.x}`);
        linea.setAttribute("y2", `${posicionDestino.y}`);
    }
}
