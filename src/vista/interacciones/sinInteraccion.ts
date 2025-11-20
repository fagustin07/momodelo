import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Posicion} from "../../posicion.ts";
import {InteracciónMER} from "./interaccion.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {Relacion} from "../../modelo/relacion.ts";

export class SinInteracción extends InteracciónMER {

    protected inicializarsePara(vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.deseleccionar();
    }

    clickEnDiagrama(_vistaEditorMER: VistaEditorMER, _posiciónDiagrama: Posicion, _posiciónVistaUsuario: Posicion) { }

    clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.seleccionarA(entidad);
    }

    clickEnRelación(relación: Relacion, vistaEditorMER: VistaEditorMER) {
        vistaEditorMER.seleccionarA(relación);
    }

    clickEnAtributo(_entidad: Entidad, atributo: Atributo, vistaEditorMER: VistaEditorMER): void {
        vistaEditorMER.seleccionarA(atributo);
    }
}