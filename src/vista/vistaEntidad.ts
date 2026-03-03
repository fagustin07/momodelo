import {Entidad} from "../modelo/entidad";
import {createElement} from "./dom/createElement";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";
import {VistaAtributo} from "./vistaAtributo.ts";
import {Atributo} from "../modelo/atributo.ts";
import {coordenada, Posicion} from "../posicion.ts";

export class VistaEntidad extends VistaElementoMER<Entidad> {
    private readonly _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _contenedorDeAtributos!: HTMLElement;

    constructor(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        super(entidad, vistaEditorMER);
        this._elementoDom = this._crearElementoDom();
    }

    private get _entidad() {
        return this._elemento;
    }

    generarVistaPara(atributo: Atributo) {
        const atrVisual = new VistaAtributo(atributo, this._vistaEditorMER, this._entidad);
        atrVisual.representarseEn(this.contenedorDeAtributos());
        return atrVisual;
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    centro() {
        return this.calcularCentroBasadoEn(this._elementoDom, this._entidad.posicion());
    }

    puntoDeConexion(destino: Posicion): Posicion {
        const centroEntidad = this.centro();
        const posicionEntidad = this._entidad.posicion();
        const anchoEntidad = this.ancho();
        const altoEntidad = this.alto();

        const bordeSuperior = posicionEntidad.y;
        const bordeInferior = posicionEntidad.y + altoEntidad;
        const bordeIzquierdo = posicionEntidad.x;
        const bordeDerecho = posicionEntidad.x + anchoEntidad;

        const elDestinoEstaArribaDeLaDiagonalAscendente = destino.y < (altoEntidad / anchoEntidad) * (destino.x - bordeIzquierdo) + bordeSuperior;
        const elDestinoEstaArribaDeLaDiagonalDescendente = destino.y < (-altoEntidad / anchoEntidad) * (destino.x - bordeDerecho) + bordeSuperior;

        if (elDestinoEstaArribaDeLaDiagonalAscendente && elDestinoEstaArribaDeLaDiagonalDescendente)
            return this._interpolarPuntoEnY(centroEntidad, destino, bordeSuperior);

        if (!elDestinoEstaArribaDeLaDiagonalAscendente && !elDestinoEstaArribaDeLaDiagonalDescendente)
            return this._interpolarPuntoEnY(centroEntidad, destino, bordeInferior);

        if (!elDestinoEstaArribaDeLaDiagonalAscendente && elDestinoEstaArribaDeLaDiagonalDescendente)
            return this._interpolarPuntoEnX(centroEntidad, destino, bordeIzquierdo);

        return this._interpolarPuntoEnX(centroEntidad, destino, bordeDerecho);
    }

    private _interpolarPunto(p0: Posicion, p1: Posicion, factor: number): Posicion {
        return coordenada(p0.x + factor * (p1.x - p0.x), p0.y + factor * (p1.y - p0.y));
    }

    private _interpolarPuntoEnY(p0: Posicion, p1: Posicion, yObjetivo: number): Posicion {
        const factorInterpolacion = (yObjetivo - p0.y) / (p1.y - p0.y);
        return this._interpolarPunto(p0, p1, factorInterpolacion);
    }

    private _interpolarPuntoEnX(p0: Posicion, p1: Posicion, xObjetivo: number): Posicion {
        const factorInterpolacion = (xObjetivo - p0.x) / (p1.x - p0.x);
        return this._interpolarPunto(p0, p1, factorInterpolacion);
    }

    ancho() {
        return this._elementoDom.getBoundingClientRect().width;
    }

    alto() {
        return this._elementoDom.getBoundingClientRect().height;
    }

    actualizarNombre() {
        this._campoNombre.value = this._entidad.nombre();
    }

    borrarse() {
        this._eliminarEntidad();
    }

    entidad() {
        return this._entidad;
    }

    contenedorDeAtributos() {
        return this._contenedorDeAtributos;
    }

    elementoDom() {
        return this._elementoDom;
    }

    actualizarEstilo() {
        if (this._entidad.esDebil()) {
            this._elementoDom.classList.add("entidad-debil");
        } else {
            this._elementoDom.classList.remove("entidad-debil");
        }
    }

    protected elementoDOM(): HTMLElement | SVGElement {
        return this._elementoDom;
    }

    private _crearElementoDom() {
        this._contenedorDeAtributos = createElement("div", {className: this._entidad.esDebil() ? "entidad-debil" : ""});
        this._campoNombre = this._crearInputCampoNombre();

        const elementoDom = this._crearElementoDOMEntidad();

        this.posicionarElemento(elementoDom);
        this.hacerArrastrable(elementoDom);

        return elementoDom;
    }

    private _crearInputCampoNombre() {
        return createElement("input", {
            title: "Nombre Entidad",
            value: this._entidad.nombre(),
            size: this.tamañoDeCampoParaTexto(this._entidad.nombre()),
            oninput: () => {
                this._campoNombre.size = this.tamañoDeCampoParaTexto(this._entidad.nombre());
                this._vistaEditorMER.renombrarEntidad(this._campoNombre.value, this._entidad);
            },
        }, []);
    }

    private _crearElementoDOMEntidad() {
        return createElement("div", {
            className: "entidad",
            onclick: () => {
                this._vistaEditorMER.emitirSeleccionDeEntidad(this._entidad);
            }
        }, [
            this._campoNombre,
            createElement("button", {
                textContent: "+",
                title: "Agregar atributo",
                onclick: (evento: PointerEvent) => {
                    evento.stopPropagation();
                    this._vistaEditorMER.emitirCreacionDeAtributoEn(this._entidad);
                }
            }, []),
            this._contenedorDeAtributos
        ]);
    }

    private _eliminarEntidad() {
        this._elementoDom.remove();
    }
}