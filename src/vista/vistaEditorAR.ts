import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {autocompletion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {analizarSintácticamente} from "../ar/parserAR.ts";
import {IntérpreteAR} from "../ar/intérpreteAR.ts";
import {ModeloER} from "../servicios/modeloER.ts";
import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../ar/resultadoConsulta.ts";
import {createElement} from "./dom/createElement.ts";
import {NombreCompletable} from "../tipos/tipos.ts";
import {extensionLenguajeAR} from "./codeMirror/lenguajeAR.ts";

type Operador = { nombre: string, símbolo: string, atajo?: number }

export class VistaEditorAR {
    private readonly _editor: EditorView;
    private readonly _panel: HTMLElement;
    private readonly _divisor: HTMLElement;
    private readonly _elementoSwitcher: HTMLElement;
    private _activo = false;
    private _palabrasModelo: NombreCompletable[] = [];
    cuandoCambie: ((activo: boolean) => void) | null = null;

    constructor(alEjecutar: () => void) {
        const wrapper = createElement("div", {className: "mr-codemirror-wrapper"});
        this._palabrasModelo = [];

        const operadores: Operador[] = [
            {nombre: "Selección", símbolo: "σ", atajo: 1},
            {nombre: "Proyección", símbolo: "π", atajo: 2},
            {nombre: "Conjunción", símbolo: "∧", atajo: 3},
            {nombre: "Disyunción", símbolo: "∨", atajo: 4},
            {nombre: "Intersección", símbolo: "∩", atajo: 5},
            {nombre: "Unión", símbolo: "∪", atajo: 6},
            {nombre: "Resta", símbolo: "-"},
            {nombre: "Producto Cartesiano", símbolo: "×", atajo: 7},
            {nombre: "Join Condicional", símbolo: "⋈", atajo: 8},
            {nombre: "Join Natural", símbolo: "*"},
            {nombre: "División", símbolo: "÷", atajo: 9},
        ]

        this._elementoSwitcher = createElement("label", {className: "mr-toggle-ar"}, [
            createElement("span", {className: "mr-toggle-ar-label", textContent: "Consultas Relacionales"}),
            createElement("span", {className: "mr-toggle-ar-track"}, [
                createElement("span", {className: "mr-toggle-ar-thumb"})
            ])
        ]);
        this._elementoSwitcher.onclick = () => this._togglear();

        this._divisor = createElement("div", {className: "mr-editores-divisor", style: {display: "none"}});

        const barraHerramientas = createElement("div", {className: "mr-ar-toolbar"},
            operadores.map(operador => this._botonParaOperador(operador)),
        );

        this._panel = createElement("div", {className: "mr-editor-panel", style: {display: "none"}}, [
            createElement("div", {className: "mr-editor-panel-label", textContent: "Álgebra Relacional"}),
            barraHerramientas,
            wrapper
        ]);

        const ejecutarKeymap = Prec.highest(keymap.of([{
            key: "Ctrl-Enter",
            run: () => { alEjecutar(); return true; }
        }]));

        const atajosParaSímbolos = EditorView.domEventHandlers({
            keydown: (event, _view) => {
                if (!event.ctrlKey || !event.shiftKey) return false;
                const operador = operadores
                    .filter(operador => operador.atajo !== undefined)
                    .find(operador => `Digit${operador.atajo}` === event.code)
                if (!operador) return false;
                event.preventDefault();
                this._insertarSímbolo(operador.símbolo);
                return true;
            }
        });

        const tabConEspacios = Prec.highest(keymap.of([{
            key: "Tab",
            run: (view) => {
                view.dispatch(view.state.replaceSelection("   "));
                return true;
            }
        }]));

        this._editor = new EditorView({
            extensions: [
                atajosParaSímbolos,
                tabConEspacios,
                basicSetup,
                ejecutarKeymap,
                autocompletion({override: [ctx => this._completar(ctx)]}),
                EditorView.lineWrapping,
                ...extensionLenguajeAR,
            ],
            parent: wrapper
        });
    }

    private _botonParaOperador(operador: Operador) {
        const tooltipAtajo = operador.atajo !== undefined ? ` (Ctrl+Shift+${operador.atajo})` : '';
        const elementosAyudaAtajo = operador.atajo !== undefined ? [createElement("span", {
            className: "mr-ar-toolbar-num",
            textContent: String(operador.atajo)
        })] : [];

        return createElement("button", {
            className: "mr-ar-toolbar-btn",
            title: `${operador.nombre}${tooltipAtajo})`,
            onclick: () => this._insertarSímbolo(operador.símbolo)
        }, [operador.símbolo, ...elementosAyudaAtajo]);
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

    setModeloER(modeloER: ModeloER | null): void {
        this._actualizarNombresConocidos(modeloER);
    }

    ejecutar(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const expresión = analizarSintácticamente(this._editor.state.doc.toString().trim());
        return new IntérpreteAR().ejecutar(expresión, modelo);
    }

    getTexto(): string {
        return this._editor.state.doc.toString();
    }

    setTexto(texto: string): void {
        this._editor.dispatch({
            changes: { from: 0, to: this._editor.state.doc.length, insert: texto }
        });
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

    private _completar(ctx: CompletionContext): CompletionResult | null {
        const palabraBuscada = ctx.matchBefore(/[A-Za-záéíóúÁÉÍÓÚñÑ_]\w*/);
        if (!palabraBuscada || (palabraBuscada.from === palabraBuscada.to && !ctx.explicit)) return null;

        return {
            from: palabraBuscada.from,
            options: this._palabrasModelo
        };
    }

    private _actualizarNombresConocidos(modeloER: ModeloER | null): void {
        if (modeloER !== null) {
            this._palabrasModelo = modeloER.nombresConocidosDelModelo();
        } else {
            this._palabrasModelo = [];
        }
    }
}