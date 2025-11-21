import {Posicion} from "../../posicion.ts";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {Entidad} from "../../modelo/entidad.ts";
import {Atributo} from "../../modelo/atributo.ts";
import {Relacion} from "../../modelo/relacion.ts";


export abstract class InteracciónMER {

    constructor(vista: VistaEditorMER) {
        this.inicializarsePara(vista);
    }

    abstract nombre(): string;

    abstract clickEnDiagrama(vistaEditorMER: VistaEditorMER, posiciónDiagrama: Posicion, posiciónVistaUsuario: Posicion): void;

    abstract clickEnEntidad(entidad: Entidad, vistaEditorMER: VistaEditorMER): void;

    abstract clickEnRelación(relación: Relacion, vistaEditorMER: VistaEditorMER): void;

    abstract clickEnAtributo(entidad: Entidad, atributo: Atributo, vistaEditorMER: VistaEditorMER): void;

    protected abstract inicializarsePara(vistaEditorMER: VistaEditorMER): void;

    estáEnProceso() {
        return true;
    }
}