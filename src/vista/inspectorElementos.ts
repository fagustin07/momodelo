import {ElementoMER} from "../modelo/elementoMER";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {createElement} from "./dom/createElement.ts";
import {TemplateInspector} from "./inspector/templateInspector.ts";
import "./inspector/templateEntidad.ts";
import "./inspector/templateAtributo.ts";
import "./inspector/templateRelacion.ts";

export class InspectorElementos {

    private readonly _contenedor: HTMLElement;
    private _template: TemplateInspector | null = null;

    constructor(elementoRaiz: HTMLElement, private readonly vistaEditor: VistaEditorMER) {
        this._contenedor = createElement("div", {id: "panel-inspector"});
        elementoRaiz.appendChild(this._contenedor);
    }

    ocultar(): void {
        this._contenedor.style.display = "none";
        this._contenedor.innerHTML = "";
        this._template = null;
    }

    mostrar(elemento: ElementoMER | null): void {
        this._contenedor.innerHTML = "";
        if (!elemento) {
            this.ocultar();
            return;
        }

        this._contenedor.style.display = "block";

        const botonCerrar = createElement("button", {
            className: "inspector-boton-cerrar",
            title: "Cerrar inspector",
            textContent: "✕",
            onclick: () => this.vistaEditor.deseleccionar(),
        });
        this._contenedor.appendChild(botonCerrar);

        this._template =
            TemplateInspector
                .puedeHacerseCargoDe(this.vistaEditor, elemento)!
                .representarseEn(this._contenedor);
    }

    actualizarInput(nuevoNombre: string): void {
        const input = this._template?.inputNombre;
        if (input) input.value = nuevoNombre;
    }
}