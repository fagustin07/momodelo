import {ElementoMER} from "../../modelo/elementoMER";
import {Atributo} from "../../modelo/atributo";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";
import {TipoAtributo} from "../../tipos/tipos.ts";
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

        contenedor.append(
            this._titulo("Atributo"),
            this._separador(),
            this._subtitulo("NOMBRE"),
            this._inputNombre!,
            this._separador(),
            this._secciónTipoDeAtributo(),
        );

        return this;
    }

    private _secciónTipoDeAtributo(): HTMLElement {
        const radios = this._radiosDeOpcionesDeTipoAtributo();

        const callbackDeSincronización = () =>
            radios.forEach(({radio}) => (radio.checked = radio.value === this.atributo.tipo()));

        this.atributo.alCambiarTipo(callbackDeSincronización);

        const grupo = createElement("div", {className: "inspector-grupo-teclas"});
        grupo.append(...radios.map(({label}) => label));
        return grupo;
    }

    private _radiosDeOpcionesDeTipoAtributo() {
        return [
            {etiqueta: "Simple", tipo: "simple"},
            {etiqueta: "Clave primaria", tipo: "pk"},
            {etiqueta: "Multivaluado", tipo: "multivaluado"},
        ]
            .map(({etiqueta, tipo}) =>
                this._opciónTipo(etiqueta, tipo as TipoAtributo));
    }

    private _opciónTipo(etiqueta: string, tipo: TipoAtributo) {
        const radio = createElement("input", {
            type: "radio",
            name: "tipo-atributo",
            checked: this.atributo.tipo() === tipo,
            className: "tecla-radio-oculto",
        });

        (radio as HTMLInputElement).value = tipo;
        (radio as HTMLInputElement).onchange = () => this.vistaEditor.cambiarTipoDeAtributo(this.atributo, tipo);

        const label = createElement("label", {textContent: etiqueta, className: "tecla tecla-inactiva"});
        label.appendChild(radio);

        return {radio: radio as HTMLInputElement, label};
    }
}

TemplateInspector.registrar(TemplateAtributo);