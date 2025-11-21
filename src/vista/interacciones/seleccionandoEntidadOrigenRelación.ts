import {InteracciónMER} from "./interaccion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Posicion} from "../../posicion.ts";
import {Relacion} from "../../modelo/relacion.ts";
import {InteraccionEnProceso} from "../../servicios/accionEnProceso.ts";

export class SeleccionandoEntidadOrigenRelación extends InteracciónMER {

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.iniciarInteracción(InteraccionEnProceso.CrearRelacion);
        vistaEditorMER.notificarInteracción("momodelo-relacion-origen");
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónDiagrama: Posicion, _posiciónVistaUsuario: Posicion) { }

    clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.marcarEntidadOrigen(entidad);
        vistaEditorMER.notificarInteracción("momodelo-relacion-destino");
    }

    clickEnRelación(_relación: Relacion, _vistaEditorMER: VistaEditorMER) { }

    clickEnAtributo(_entidad: Entidad, _atributo: Atributo, _vistaEditorMER: VistaEditorMER) { }
}