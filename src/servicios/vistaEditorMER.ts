import {VistaEntidad} from "../vista/vistaEntidad.ts";
import {Modelador} from "./modelador.ts";
import {Posicion} from "../posicion.ts";

export class VistaEditorMER {
    private readonly _modelador: Modelador;
    private readonly _elementoRaiz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    constructor(modelador: Modelador, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        this._modelador = modelador;
        this._elementoRaiz = elementoRaiz;
        this._elementoSvg = elementoSvg;
    }

    solicitarCreacionDeEntidad(posicion: Posicion) {
        const nuevaEntidad = this._modelador.generarEntidadUbicadaEn(posicion);
            const vistaEntidad = new VistaEntidad(nuevaEntidad, this._modelador);
            vistaEntidad.representarseEn(this._elementoRaiz);
    }
}
