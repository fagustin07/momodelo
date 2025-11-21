import {VistaEditorMER} from "../vistaEditorMER.ts";
import {InteraccionEnProceso} from "../../servicios/accionEnProceso.ts";
import {Posicion} from "../../posicion.ts";
import {InteracciónMER} from "./interaccion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {Relacion} from "../../modelo/relacion.ts";

export class CreandoEntidad extends InteracciónMER {

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.deseleccionar();
        vistaEditorMER.ignorarEventosDesdeEntidadesVisuales();
        vistaEditorMER.iniciarInteracción(InteraccionEnProceso.CrearEntidad);
        vistaEditorMER.notificarInteracción("momodelo-crear-entidad");
    }

    clickEnDiagrama(vistaEditorMER: VistaEditorMER, posiciónModelo: Posicion, posiciónVistaUsuario: Posicion) {
        const nuevaEntidad = vistaEditorMER.generarEntidadUbicadaEn(this.calcularPosiciónEnDiagrama(posiciónModelo, posiciónVistaUsuario));
        vistaEditorMER.crearVistaEntidad(nuevaEntidad);
        vistaEditorMER.finalizarInteracción();
        vistaEditorMER.seleccionarA(nuevaEntidad);
    }

    clickEnEntidad(_entidad: Entidad, _vistaEditorMER: VistaEditorMER) { }

    clickEnRelación(_relación: Relacion, _vistaEditorMER: VistaEditorMER) { }

    clickEnAtributo(_entidad: Entidad, _atributo: Atributo, _vistaEditorMER: VistaEditorMER) { }

    private calcularPosiciónEnDiagrama(posiciónModelo: Posicion, posiciónVistaUsuario: Posicion) {
        return posiciónModelo.minus(posiciónVistaUsuario);
    }
}