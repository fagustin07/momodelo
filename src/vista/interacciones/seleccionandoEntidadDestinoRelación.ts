import {InteracciónMER} from "./interaccion.ts";
import {Posicion} from "../../posicion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Relacion} from "../../modelo/relacion.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";

export class SeleccionandoEntidadDestinoRelación extends InteracciónMER {

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.notificarInteracción("momodelo-relacion-destino");
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónDiagrama: Posicion, _posiciónVistaUsuario: Posicion) { }

    clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        const nuevaRelación = vistaEditorMER.crearRelaciónConDestinoEn(entidad);
        vistaEditorMER.crearVistaRelación(nuevaRelación);
        vistaEditorMER.finalizarInteracción();
        vistaEditorMER.emitirSeleccionDeRelación(nuevaRelación);
    }

    clickEnRelación(_relación: Relacion, _vistaEditorMER: VistaEditorMER) { }

    clickEnAtributo(_entidad: Entidad, _atributo: Atributo, _vistaEditorMER: VistaEditorMER) { }

    nombre() {
        return "Crear Relacion";
    }
}
