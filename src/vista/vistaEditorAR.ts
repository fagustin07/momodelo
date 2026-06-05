import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {analizarSintácticamente} from "../ar/parserAR.ts";
import {IntérpreteAR} from "../ar/intérpreteAR.ts";
import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../ar/resultadoConsulta.ts";
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

        const barraHerramientas = createElement("div", {className: "mr-ar-toolbar"}, [
            createElement("button", {className: "mr-ar-toolbar-btn", title: "Selección (Ctrl+Shift+1)", onclick: () => this._insertarSímbolo("σ")}, ["σ", createElement("span", {className: "mr-ar-toolbar-num", textContent: "1"})]),
            createElement("button", {className: "mr-ar-toolbar-btn", title: "Proyección (Ctrl+Shift+2)", onclick: () => this._insertarSímbolo("π")}, ["π", createElement("span", {className: "mr-ar-toolbar-num", textContent: "2"})]),
            createElement("button", {className: "mr-ar-toolbar-btn", title: "Conjunción (Ctrl+Shift+3)", onclick: () => this._insertarSímbolo("∧")}, ["∧", createElement("span", {className: "mr-ar-toolbar-num", textContent: "3"})]),
            createElement("button", {className: "mr-ar-toolbar-btn", title: "Disyunción (Ctrl+Shift+4)", onclick: () => this._insertarSímbolo("∨")}, ["∨", createElement("span", {className: "mr-ar-toolbar-num", textContent: "4"})]),
        ]);

        this._panel = createElement("div", {className: "mr-editor-panel", style: {display: "none"}}, [
            createElement("div", {className: "mr-editor-panel-label", textContent: "Álgebra Relacional"}),
            barraHerramientas,
            wrapper
        ]);

        const ejecutarKeymap = Prec.highest(keymap.of([{
            key: "Ctrl-Enter",
            run: () => { alEjecutar(); return true; }
        }]));

        const atajosParaSímbolos = Prec.highest(keymap.of([
            { key: "Ctrl-Shift-1", run: () => { this._insertarSímbolo("σ"); return true; } },
            { key: "Ctrl-Shift-2", run: () => { this._insertarSímbolo("π"); return true; } },
            { key: "Ctrl-Shift-3", run: () => { this._insertarSímbolo("∧"); return true; } },
            { key: "Ctrl-Shift-4", run: () => { this._insertarSímbolo("∨"); return true; } },
        ]));

        const tabConEspacios = Prec.highest(keymap.of([{
            key: "Tab",
            run: (view) => {
                view.dispatch(view.state.replaceSelection("   "));
                return true;
            }
        }]));

        this._editor = new EditorView({
            extensions: [atajosParaSímbolos, tabConEspacios, basicSetup, ejecutarKeymap],
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

    ejecutar(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const expresión = analizarSintácticamente(this._editor.state.doc.toString().trim());
        return new IntérpreteAR().ejecutar(expresión, modelo);
    }

    private _togglear(): void {
        this._activo = !this._activo;
        this._panel.style.display = this._activo ? "" : "none";
        this._divisor.style.display = this._activo ? "" : "none";
        this._elementoSwitcher.classList.toggle("mr-toggle-ar--activo", this._activo);
        this.cuandoCambie?.(this._activo);
    }

    private _insertarSímbolo(símbolo: string): void {
        const selección = this._editor.state.selection.main;
        this._editor.dispatch({
            changes: { from: selección.from, to: selección.to, insert: símbolo },
            selection: { anchor: selección.from + símbolo.length }
        });
        this._editor.focus();
    }
}