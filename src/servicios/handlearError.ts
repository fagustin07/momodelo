import {MomodeloError} from "./errores.ts";
import {VistaEditorMER} from "../vista/vistaEditorMER.ts";

export function handlearError(error: any, vistaEditorMER: VistaEditorMER) {
    if (error instanceof MomodeloError) {
        vistaEditorMER.mostrarMensajeDeError(error.message);
    } else {
        throw error;
    }
}
