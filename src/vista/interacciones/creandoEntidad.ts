import {VistaEditorMER} from "../vistaEditorMER.ts";
import {InteraccionEnProceso} from "../../servicios/accionEnProceso.ts";
import {Posicion} from "../../posicion.ts";
import {InteracciónMER} from "./interaccion.ts";

export class CreandoEntidad extends InteracciónMER {

    clickEnDiagrama(vistaEditorMER: VistaEditorMER, posiciónDiagrama: Posicion, posiciónVistaUsuario: Posicion) {
        const entidadNueva = vistaEditorMER.generarEntidadUbicadaEn(posiciónDiagrama.minus(posiciónVistaUsuario));
        vistaEditorMER.crearVistaEntidad(entidadNueva);
        vistaEditorMER.finalizarInteracción();
        vistaEditorMER.seleccionarA(entidadNueva);
    }

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.iniciarInteracción(InteraccionEnProceso.CrearEntidad);
        vistaEditorMER.desplegarEvento("momodelo-crear-entidad");
    }
}
