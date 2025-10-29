import {Entidad} from "../modelo/entidad.ts";
import {createElement, createSvgElement} from "./dom/createElement.ts";
import {Atributo} from "../modelo/atributo.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";

export class VistaAtributo extends VistaElementoMER<Atributo> {
    private _entidad: Entidad;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _linea!: SVGLineElement;

    constructor(atributo: Atributo, vistaEditorMER: VistaEditorMER, entidad: Entidad) {
        super(atributo, vistaEditorMER);
        this._entidad = entidad;
        this._elementoDom = this._crearElementoDom();
        this._crearLinea();
    }

    private get _atributo() {
        return this._elemento;
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._vistaEditorMER.agregarElementoSvg(this._linea);
        this._actualizarLinea();
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    centro() {
        const posiciónAtributo = this._entidad.posicion().plus(this._atributo.posicion());
        return this.calcularCentroBasadoEn(this._elementoDom, posiciónAtributo);
    }

    borrarse() {
        this._elementoDom.remove();
        this._linea.remove();
    }

    reposicionarConexión() {
        this._actualizarLinea();
    }

    private _crearElementoDom() {
        let elementoDom = createElement("div", {
            className: "atributo",
            onclick: evento => {
                evento.stopPropagation();
                this._vistaEditorMER.emitirSeleccionDeAtributo(this._entidad, this._atributo);
            }
        }, [
            this._campoNombre = createElement("input", {
                value: this._atributo.nombre(),
                title: "Nombre de atributo",
                size: 1,
                oninput: () => {
                    this._campoNombre.size = Math.max(1, this._campoNombre.value.length);
                    this._actualizarLinea();
                    this._cambiarNombreEnModelo();
                }
            })
        ]);

        this.posicionarElemento(elementoDom);
        this.hacerArrastrable(elementoDom);

        return elementoDom;
    }

    private _cambiarNombreEnModelo() {
        this._vistaEditorMER.renombrarAtributo(this._valorCampoNombre(), this._atributo, this._entidad);
    }

    private _valorCampoNombre() {
        return this._campoNombre.value;
    }

    private _crearLinea() {
        this._linea = createSvgElement("line", {
            stroke: "gray",
            "stroke-width": 1,
            "pointer-events": "none",
        });
    }

    private _actualizarLinea() {
        const centroEntidad = this._vistaEditorMER.centroDeEntidad(this._entidad);
        const centroAtributo = this.centro();

        this._linea.setAttribute("x1", `${centroEntidad.x}`);
        this._linea.setAttribute("y1", `${centroEntidad.y}`);
        this._linea.setAttribute("x2", `${centroAtributo.x}`);
        this._linea.setAttribute("y2", `${centroAtributo.y}`);
    }
}