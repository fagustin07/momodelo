import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Posicion} from "../../posicion.ts";
import {InteracciónMER} from "./interaccion.ts";

export class SinInteracción extends InteracciónMER {
    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.finalizarInteracción();
        vistaEditorMER.deseleccionar();
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónDiagrama: Posicion, _posiciónVistaUsuario: Posicion) {

    }
}
