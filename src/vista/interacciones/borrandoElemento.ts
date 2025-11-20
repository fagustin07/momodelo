import {InteracciónMER} from "./interaccion.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Posicion} from "../../posicion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {InteraccionEnProceso} from "../../servicios/accionEnProceso.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {Relacion} from "../../modelo/relacion.ts";

export class BorrandoElemento extends InteracciónMER {

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.deseleccionar();
        vistaEditorMER.iniciarInteracción(InteraccionEnProceso.Borrado);
        vistaEditorMER.desplegarEvento("momodelo-borrar-elemento");
        vistaEditorMER.capturarEventosDesdeEntidadesVisuales();
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónModelo: Posicion, _posiciónVistaUsuario: Posicion) { }

    clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.borrarEntidad(entidad);
        vistaEditorMER.finalizarInteracción();
    }

    clickEnRelación(relación: Relacion, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.borrarRelación(relación);
        vistaEditorMER.finalizarInteracción();
    }


    clickEnAtributo(entidad: Entidad, atributo: Atributo, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.borrarAtributo(atributo, entidad);
        vistaEditorMER.finalizarInteracción();
    }
}