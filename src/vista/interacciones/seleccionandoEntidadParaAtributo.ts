import {InteracciónMER} from "./interaccion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Posicion} from "../../posicion.ts";
import {Relacion} from "../../modelo/relacion.ts";

export class SeleccionandoEntidadParaAtributo extends InteracciónMER {
    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.deseleccionar();
        vistaEditorMER.iniciarInteracciónPara(this);
        vistaEditorMER.capturarEventosDesdeEntidadesVisuales();
        vistaEditorMER.notificarInteracción("momodelo-crear-atributo");
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónDiagrama: Posicion, _posiciónVistaUsuario: Posicion) { }

    clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.finalizarInteracción();
        vistaEditorMER.emitirCreacionDeAtributoEn(entidad);
    }

    clickEnRelación(_relación: Relacion, _vistaEditorMER: VistaEditorMER) { }

    clickEnAtributo(_entidad: Entidad, _atributo: Atributo, _vistaEditorMER: VistaEditorMER) { }

    nombre() {
        return "Crear Atributo";
    }
}