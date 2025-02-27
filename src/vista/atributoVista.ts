import {Atributo} from "../modelo/atributo";

// tienen sentido representarlas como clases?
class AtributoVista {

    private _atributo: Atributo;

    constructor (Atributo: Atributo){
        this._atributo = Atributo;
    }

    representarse(document: Document): HTMLDivElement {
        return document.createElement("div");
    }
}