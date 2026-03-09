import {ElementoMER} from "../../modelo/elementoMER";
import {Atributo} from "../../modelo/atributo";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";
import {TemplateInspector} from "./templateInspector.ts";

export class TemplateAtributo extends TemplateInspector {

    static puedeManejar(elemento: ElementoMER): boolean {
        return elemento.representaUnAtributo();
    }

    private readonly atributo: Atributo;

    constructor(
        vistaEditor: VistaEditorMER,
        onRerenderizar: (elemento: ElementoMER) => void,
        elemento: ElementoMER,
    ) {
        super(vistaEditor, onRerenderizar);
        this.atributo = elemento as Atributo;
    }

    representarseEn(contenedor: HTMLElement): TemplateAtributo {
        this._inputCon(this.atributo.nombre());
        this._inputNombre!.oninput = () =>
            this.vistaEditor.renombrarAtributo(this._inputNombre!.value, this.atributo);

        const teclaPK = this._tecla("Clave primaria", "Marcar como clave primaria", this.atributo.esPK(), () => {
            this.atributo.esPK()
                ? this.vistaEditor.desmarcarAtributoComoClavePrimaria(this.atributo)
                : this.vistaEditor.marcarAtributoComoClavePrimaria(this.atributo);
        });

        const teclaMultivaluado = this._tecla("Multivaluado", "Marcar como multivaluado", this.atributo.esMultivaluado(), () => {
            this.atributo.esMultivaluado()
                ? this.vistaEditor.desmarcarAtributoMultivaluado(this.atributo)
                : this.vistaEditor.marcarAtributoMultivaluado(this.atributo);
        });

        this.atributo.alCambiarElSerPK(() => {
            teclaPK.classList.toggle("tecla-activa", this.atributo.esPK());
            teclaPK.classList.toggle("tecla-inactiva", !this.atributo.esPK());
        });

        this.atributo.alCambiarElSerMultivaluado(() => {
            teclaMultivaluado.classList.toggle("tecla-activa", this.atributo.esMultivaluado());
            teclaMultivaluado.classList.toggle("tecla-inactiva", !this.atributo.esMultivaluado());
        });

        const grupoTeclas = createElement("div", {className: "inspector-grupo-teclas tecla-grupo-segmentado"});
        grupoTeclas.append(teclaPK, teclaMultivaluado);

        contenedor.append(
            this._titulo("Atributo"),
            this._separador(),
            this._subtitulo("NOMBRE"),
            this._inputNombre!,
            this._separador(),
            grupoTeclas,
        );

        return this;
    }
}

TemplateInspector.registrar(TemplateAtributo);