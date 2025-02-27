import {Entidad} from "../modelo/entidad.ts";
import {createElement} from "./dom/createElement.ts";

export class VistaAtributo {
    private _entidad: Entidad;
    private _idAtributo: number;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;

    constructor(entidad: Entidad, idAtributo: number) {
        this._entidad = entidad;
        this._idAtributo = idAtributo;
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
                value: this._entidad.nombreAtributo(this._idAtributo),
                title: "Nombre de atributo",
                oninput: () => this._renombrarAtributo()
            })
        ]);
    }

    private _renombrarAtributo() {
        this._entidad.renombrarAtributo(
            this._idAtributo,
            this._campoNombre.value,
        );
    }

    private _eliminarAtributo() {
        this._elementoDom.remove();
        this._entidad.atributos().splice(this._idAtributo, 1);
        console.log(`Atributo eliminado`);
    }
}