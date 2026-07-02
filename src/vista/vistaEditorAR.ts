import {EditorView} from "@codemirror/view";
import {CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {analizarSintácticamente} from "../ar/parserAR.ts";
import {IntérpreteAR} from "../ar/intérpreteAR.ts";
import {ModeloER} from "../servicios/modeloER.ts";
import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../ar/resultadoConsulta.ts";
import {createElement} from "./dom/createElement.ts";
import {NombreCompletable} from "../tipos/tipos.ts";
import {generarExtensionesAR} from "./codeMirror/extensiones.ts";

type Operador = { nombre: string, símbolo: string, atajo: string }

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
            {nombre: "Selección", símbolo: "σ", atajo: "Digit1"},
            {nombre: "Proyección", símbolo: "π", atajo: "Digit2"},
            {nombre: "Conjunción", símbolo: "∧", atajo: "Digit3"},
            {nombre: "Disyunción", símbolo: "∨", atajo: "Digit4"},
            {nombre: "Intersección", símbolo: "∩", atajo: "Digit5"},
            {nombre: "Unión", símbolo: "∪", atajo: "Digit6"},
            {nombre: "Resta", símbolo: "-", atajo: "Digit7"},
            {nombre: "Join Natural", símbolo: "*", atajo: "Digit8"},
            {nombre: "Join Condicional", símbolo: "⋈", atajo: "Digit9"},
            {nombre: "División", símbolo: "÷", atajo: "Digit0"},
            {nombre: "Asignación", símbolo: "←", atajo: "KeyA"},
            {nombre: "Renombre", símbolo: "ρ", atajo: "KeyR"},
            {nombre: "Producto Cartesiano", símbolo: "×", atajo: "KeyC"}
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

        const atajosParaSímbolos = EditorView.domEventHandlers({
            keydown: (event, _view) => {
                if (!event.ctrlKey || !event.shiftKey) return false;
                const operador = operadores.find(op => op.atajo === event.code);
                if (!operador) return false;
                event.preventDefault();
                this._insertarSímbolo(operador.símbolo);
                return true;
            }
        });

        this._editor = new EditorView({
            extensions: generarExtensionesAR(
                (ctx) => this._completar(ctx),
                () => alEjecutar(),
                atajosParaSímbolos,
            ),
            parent: wrapper
        });
    }

    private _botonParaOperador(operador: Operador) {
        const teclaDeAtajo = operador.atajo.replace(/^(Digit|Key)/, "");
        return createElement("button", {
            className: "mr-ar-toolbar-btn",
            title: `${operador.nombre} (Ctrl+Shift+${teclaDeAtajo})`,
            onclick: () => this._insertarSímbolo(operador.símbolo)
        }, [operador.símbolo, createElement("span", {
            className: "mr-ar-toolbar-num",
            textContent: teclaDeAtajo
        })]);
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
            options: [
                ...this._palabrasModelo,
                {label: "verdadero", type: "text"},
                {label: "falso", type: "text"},
            ]
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