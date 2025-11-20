import {Posicion} from "../../posicion.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";


export abstract class InteracciónMER {

    constructor(vista: VistaEditorMER) {
        this.inicializarsePara(vista);
    }

    abstract clickEnDiagrama(vistaEditorMER: VistaEditorMER, posiciónDiagrama: Posicion, posiciónVistaUsuario: Posicion): void;

    protected abstract inicializarsePara(vistaEditorMER: VistaEditorMER): void;
}