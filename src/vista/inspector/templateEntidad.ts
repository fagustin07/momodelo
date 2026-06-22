import {ElementoMER} from "../../modelo/elementoMER";
import {Entidad} from "../../modelo/entidad";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateEntidad extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnaEntidad();
    }

    constructor(
        vistaEditor: VistaEditorMER,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, elemento);
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

    private get entidad(): Entidad {
        return this.elemento as Entidad;
    }
}

TemplateInspector.registrar(TemplateEntidad);