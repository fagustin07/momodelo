import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {parsearConsulta} from "../ar/parserAR.ts";
import {IntérpreteAR} from "../ar/intérpreteAR.ts";
import {ModeloRelacionalMaterializado, RelacionMaterializada} from "../mr/modeloRelacionalMaterializado.ts";
import {createElement} from "./dom/createElement.ts";

export class VistaEditorAR {
    private readonly _editor: EditorView;
    private readonly _panel: HTMLElement;
    private readonly _divisor: HTMLElement;
    private readonly _elementoSwitcher: HTMLElement;
    private _activo = false;
    cuandoCambie: ((activo: boolean) => void) | null = null;

    constructor(alEjecutar: () => void) {
        const wrapper = createElement("div", {className: "mr-codemirror-wrapper"});

        this._elementoSwitcher = createElement("label", {className: "mr-toggle-ar"}, [
            createElement("span", {className: "mr-toggle-ar-label", textContent: "Consultas Relacionales"}),
            createElement("span", {className: "mr-toggle-ar-track"}, [
                createElement("span", {className: "mr-toggle-ar-thumb"})
            ])
        ]);
        this._elementoSwitcher.onclick = () => this._togglear();

        this._divisor = createElement("div", {className: "mr-editores-divisor", style: {display: "none"}});

        this._panel = createElement("div", {className: "mr-editor-panel", style: {display: "none"}}, [
            createElement("div", {className: "mr-editor-panel-label", textContent: "Álgebra Relacional"}),
            wrapper
        ]);

        const ejecutarKeymap = Prec.highest(keymap.of([{
            key: "Ctrl-Enter",
            run: () => { alEjecutar(); return true; }
        }]));

        this._editor = new EditorView({
            extensions: [basicSetup, ejecutarKeymap],
            parent: wrapper
        });
    }

    activo(): boolean {
        return this._activo;
    }

    elementoSwitcher(): HTMLElement {
        return this._elementoSwitcher;
    }

    elementoPanel(): HTMLElement {
        return this._panel;
    }

    elementoDivisor(): HTMLElement {
        return this._divisor;
    }

    tieneConsulta(): boolean {
        return this._editor.state.doc.toString().trim().length > 0;
    }

    ejecutar(modelo: ModeloRelacionalMaterializado): RelacionMaterializada {
        const expresión = parsearConsulta(this._editor.state.doc.toString().trim());
        return new IntérpreteAR().ejecutar(expresión, modelo);
    }

    private _togglear(): void {
        this._activo = !this._activo;
        this._panel.style.display = this._activo ? "" : "none";
        this._divisor.style.display = this._activo ? "" : "none";
        this._elementoSwitcher.classList.toggle("mr-toggle-ar--activo", this._activo);
        this.cuandoCambie?.(this._activo);
    }
}
