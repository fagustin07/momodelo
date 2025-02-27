import {Entidad} from "../modelo/entidad.ts";
import {createElement} from "./dom/createElement.ts";
import {Modelador} from "../servicios/modelador.ts";
import {IdAtributo} from "../../types";

export class VistaAtributo {
    private _entidad: Entidad;
    private _indiceAtributo: number;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _modelador: Modelador;

    constructor(entidad: Entidad, idAtributo: number, modelador: Modelador) {
        this._entidad = entidad;
        this._indiceAtributo = idAtributo;
        this._modelador = modelador;
        this._elementoDom = this._crearElementoDom();
    }

    representarse() {
        return this._elementoDom;
    }

    private _crearElementoDom() {
        return createElement("div", {
            className: "atributo",
            onclick: evento => {
                if (evento.ctrlKey && evento.shiftKey) {
                    evento.stopPropagation();
                    this._eliminarAtributo();
                }
            }
        }, [
            this._campoNombre = createElement("input", {
                value: this._entidad.nombreAtributo(this._indiceAtributo),
                title: "Nombre de atributo",
                oninput: () => this._modelador
                    .renombrarAtributo(this._valorCampoNombre(), this._idAtributo())
            })
        ]);
    }

    private _valorCampoNombre() {
        return this._campoNombre.value;
    }

    private _idAtributo(): IdAtributo {
        return [this._entidad, this._indiceAtributo];
    }

    private _eliminarAtributo() {
        this._elementoDom.remove();
        this._entidad.atributos().splice(this._indiceAtributo, 1);
        console.log(`Atributo eliminado`);
    }
}