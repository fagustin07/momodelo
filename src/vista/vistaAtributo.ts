import {Entidad} from "../modelo/entidad.ts";
import {createElement} from "./dom/createElement.ts";
import {Modelador} from "../servicios/modelador.ts";
import {Atributo} from "../modelo/atributo.ts";

export class VistaAtributo {
    private _atributo: Atributo;
    private _entidad: Entidad;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _modelador: Modelador;

    constructor(atributo: Atributo, modelador: Modelador, entidad: Entidad) {
        this._atributo = atributo;
        this._entidad = entidad;
        this._modelador = modelador;
        this._elementoDom = this._crearElementoDom();
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    private _crearElementoDom() {
        return createElement("div", {
            className: "atributo",
            onclick: evento => {
                evento.stopPropagation();
                this._modelador.emitirSeleccionDeAtributo(this._entidad, this._atributo, this._eliminarAtributo.bind(this));
            }
        }, [
            this._campoNombre = createElement("input", {
                value: this._atributo.nombre(),
                title: "Nombre de atributo",
                oninput: () => this._cambiarNombreEnModelo()
            })
        ]);
    }

    private _cambiarNombreEnModelo() {
        this._modelador.renombrarAtributo(this._valorCampoNombre(), this._atributo, this._entidad);
    }

    private _valorCampoNombre() {
        return this._campoNombre.value;
    }

    private _eliminarAtributo() {
        this._elementoDom.remove();
    }
}