import {MomodeloErrorImplementaciónPlanificada} from "./errores.ts";
import {VistaEditorMER} from "../vista/vistaEditorMER.ts";

export function handlearError(error: any, vistaEditorMER: VistaEditorMER) {
    if (error instanceof MomodeloErrorImplementaciónPlanificada) {
        vistaEditorMER.mostrarMensajeDeError(error.message);
    } else {
        throw error;
    }
}
