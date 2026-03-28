import {ElementoMER} from "../../modelo/elementoMER";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";

type TemplateRegistrable = {
    new(vistaEditor: VistaEditorMER, onRerenderizar: (el: ElementoMER) => void, elemento: ElementoMER): TemplateInspector;
    puedeManejar(elemento: ElementoMER): boolean;
};

export abstract class TemplateInspector {

    private static readonly _registradas: TemplateRegistrable[] = [];

    protected _inputNombre: HTMLInputElement | null = null;

    constructor(
        protected readonly vistaEditor: VistaEditorMER,
        protected readonly onRerenderizar: (elemento: ElementoMER) => void,
    ) {}

    static registrar(clase: TemplateRegistrable): void {
        TemplateInspector._registradas.push(clase);
    }

    static puedeHacerseCargoDe(
        vistaEditor: VistaEditorMER,
        onRerenderizar: (elemento: ElementoMER) => void,
        elemento: ElementoMER,
    ): TemplateInspector {
        return new (
            TemplateInspector
                ._registradas
                .find(template => template.puedeManejar(elemento))!)(vistaEditor, onRerenderizar, elemento)
    }

    abstract representarseEn(contenedor: HTMLElement): TemplateInspector;

    get inputNombre(): HTMLInputElement | null {
        return this._inputNombre;
    }

    protected _separador(): HTMLElement {
        return createElement("div", {className: "inspector-separador"});
    }

    protected _titulo(texto: string): HTMLElement {
        return createElement("h3", {
            textContent: "Inspector de " + texto,
            title: "Tipo Elemento Inspeccionado",
            style: {fontSize: "1rem", marginBottom: "1rem", color: "#443939"},
        });
    }

    protected _subtitulo(texto: string): HTMLElement {
        return createElement("h4", {
            textContent: texto,
            className: "inspector-seccion-cardinalidades",
        });
    }

    protected _inputCon(valor: string): void {
        this._inputNombre = createElement("input", {
            value: valor,
            title: "Nombre Elemento Inspeccionado",
            type: "text",
            className: "inspector-input-nombre",
            style: {
                width: "100%",
                padding: "0.3rem 0.5rem",
                marginTop: "0.3rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "0.875rem",
                boxSizing: "border-box",
                background: "#fff",
            },
        });
    }
}