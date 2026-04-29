import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {autocompletion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {ModeloER} from "../servicios/modeloER.ts";
import {AnalizadorSintácticoMR} from "../mr/analizadorSintacticoMR.ts";
import {AnalizadorSemánticoMR} from "../mr/analizadorSemanticoMR.ts";
import {ComparadorMR} from "../mr/comparadorMR.ts";
import {ErrorSintácticoMR, ErroresValidaciónMR} from "../servicios/errores.ts";
import {createElement} from "./dom/createElement.ts";

export class VistaEditorMR {
    private readonly _elementoRaíz: HTMLElement;
    private readonly _consola: HTMLElement;
    private readonly _overlay: HTMLElement;
    private readonly _editorView: EditorView;
    private _modeloER: ModeloER | null = null;

    constructor(contenedor: HTMLElement) {
        this._elementoRaíz = contenedor;

        const codemirrorWrapper = createElement("div", {className: "mr-codemirror-wrapper"});
        this._consola = createElement("div", {className: "mr-consola"});
        this._overlay = createElement("div", {className: "mr-consola-overlay", textContent: "Ejecutando...", style: {display: "none"}});

        const topbar = createElement("div", {className: "mr-topbar"}, [
            createElement("span", {className: "mr-topbar-titulo", textContent: "Modelo Relacional"}),
            createElement("button", {
                className: "mr-btn-ejecutar",
                textContent: "▶︎ Ejecutar",
                onclick: () => this._ejecutar()
            })
        ]);

        const consolaHeader = createElement("div", {className: "mr-consola-header"}, [
            createElement("span", {className: "mr-consola-header-titulo", textContent: "RESULTADO"}),
            createElement("button", {
                className: "mr-consola-btn-limpiar",
                textContent: "Limpiar",
                onclick: () => this._limpiarConsola()
            })
        ]);

        const consolaWrapper = createElement("div", {className: "mr-consola-wrapper"}, [
            consolaHeader,
            this._consola,
            this._overlay
        ]);

        const editorWrapper = createElement("div", {className: "mr-editor-wrapper"}, [
            topbar,
            codemirrorWrapper,
            consolaWrapper
        ]);

        this._elementoRaíz.append(editorWrapper);

        this._editorView = new EditorView({
            extensions: [
                basicSetup,
                autocompletion({override: [ctx => this._completar(ctx)]}),
                Prec.highest(keymap.of([{
                    key: "Ctrl-Enter",
                    run: () => { this._ejecutar(); return true; }
                }]))
            ],
            parent: codemirrorWrapper
        });

        this._mostrarMensajeDefault();
    }

    get elementoContenedor(): HTMLElement {
        return this._elementoRaíz;
    }

    setModeloER(modeloER: ModeloER | null): void {
        this._modeloER = modeloER;
        this._limpiarConsola();
        this._mostrarMensajeDefault();
    }

    private _ejecutar(): void {
        this._overlay.style.display = "flex";

        requestAnimationFrame(() => setTimeout(() => {
            this._overlay.style.display = "none";
            this._limpiarConsola();

            const input = this._editorView.state.doc.toString();

            try {
                const modeloMR = new AnalizadorSintácticoMR().analizarSintaxisDe(input);
                new AnalizadorSemánticoMR().validar(modeloMR);

                if (this._modeloER !== null) {
                    new ComparadorMR().esConsistente(this._modeloER, modeloMR);
                    this._mostrarÉxito("[OK] Su Modelo Relacional tiene correspondencia con el MER provisto.");
                } else {
                    this._mostrarÉxito("[OK] Modelo relacional válido.");
                }
            } catch (e) {
                if (e instanceof ErrorSintácticoMR) {
                    this._mostrarError(e.message);
                } else if (e instanceof ErroresValidaciónMR) {
                    e.errores.forEach(msg => this._mostrarError(msg));
                } else {
                    throw e;
                }
            }
        }, 200));
    }

    private _completar(context: CompletionContext): CompletionResult | null {
        const palabraBuscada = context.matchBefore(/[A-Za-záéíóúÁÉÍÓÚñÑ_]\w*/);
        if (!palabraBuscada || (palabraBuscada.from === palabraBuscada.to && !context.explicit)) return null;

        const palabras = this._palabrasDelMER();
        if (palabras.length === 0) return null;

        return {
            from: palabraBuscada.from,
            options: palabras.map(label => ({label, type: "keyword"}))
        };
    }

    private _palabrasDelMER(): string[] {
        if (!this._modeloER) return [];
        const palabras = new Set<string>();
        this._modeloER.entidades.forEach(entidad => {
            palabras.add(entidad.nombre());
            entidad.atributos().forEach(atr => palabras.add(atr.nombre()));
        });
        return [...palabras];
    }

    private _limpiarConsola(): void {
        this._consola.innerHTML = "";
    }

    private _mostrarMensajeDefault(): void {
        this._consola.append(
            createElement("div", {className: "mr-consola-linea mr-consola-info", textContent: "Presioná Ctrl+Enter (o el botón Ejecutar) para validar el modelo."})
        );
    }

    private _mostrarError(mensaje: string): void {
        this._consola.append(
            createElement("div", {className: "mr-consola-linea mr-consola-error", textContent: `[ERROR] ${mensaje}`})
        );
    }

    private _mostrarÉxito(mensaje: string): void {
        this._consola.append(
            createElement("div", {className: "mr-consola-linea mr-consola-exito", textContent: mensaje})
        );
    }
}
