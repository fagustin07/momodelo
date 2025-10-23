import {Entidad} from "../modelo/entidad.ts";
import {createElement} from "./dom/createElement.ts";
import {Atributo} from "../modelo/atributo.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {VistaElementoMER} from "./vistaElementoMER.ts";

export class VistaAtributo extends VistaElementoMER<Atributo> {
    private _entidad: Entidad;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;

    constructor(atributo: Atributo, vistaEditorMER: VistaEditorMER, entidad: Entidad) {
        super(atributo, vistaEditorMER);
        this._entidad = entidad;
        this._elementoDom = this._crearElementoDom();
    }

    private get _atributo() {
        return this._elemento;
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    borrarse() {
        this._elementoDom.remove();
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
                oninput: () => this._cambiarNombreEnModelo()
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
}