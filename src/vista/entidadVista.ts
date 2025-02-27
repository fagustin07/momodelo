import {Entidad} from "../modelo/entidad";

class EntidadVista {

    private _entidad: Entidad;

    constructor (entidad: Entidad){
        this._entidad = entidad;
    }


    representarse(document: Document): HTMLDivElement {
        return document.createElement("div");
    }
}