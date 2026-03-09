import {ElementoMER} from "../../modelo/elementoMER";
import {Entidad} from "../../modelo/entidad";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateEntidad extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnaEntidad();
    }

    private readonly entidad: Entidad;

    constructor(
        vistaEditor: VistaEditorMER,
        onRerenderizar: (elemento: ElementoMER) => void,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, onRerenderizar);
        this.entidad = elemento as Entidad;
    }

    representarseEn(contenedor: HTMLElement): TemplateEntidad {
        this._inputCon(this.entidad.nombre());
        this._inputNombre!.oninput = () =>
            this.vistaEditor.renombrarEntidad(this._inputNombre!.value, this.entidad);

        contenedor.append(
            this._titulo("Entidad"),
            this._separador(),
            this._subtitulo("NOMBRE"),
            this._inputNombre!,
        );

        return this;
    }
}

TemplateInspector.registrar(TemplateEntidad);