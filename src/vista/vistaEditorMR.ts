import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {autocompletion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {ModeloER} from "../servicios/modeloER.ts";
import {AnalizadorSintácticoMR} from "../mr/analizadorSintacticoMR.ts";
import {ValidadorSemánticoMR} from "../mr/validadorSemanticoMR.ts";
import {IntérpreteMR} from "../mr/interpretadorMR.ts";
import {ErrorPKDuplicada, ErrorSintácticoAR, ErrorSintácticoMR, ErroresValidación, MomodeloLogicaError} from "../servicios/errores.ts";
import {createElement} from "./dom/createElement.ts";
import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../ar/resultadoConsulta.ts";
import {VistaEditorAR} from "./vistaEditorAR.ts";

export class VistaEditorMR {
    private readonly _elementoRaíz: HTMLElement;
    private readonly _consola: HTMLElement;
    private readonly _consolaWrapper: HTMLElement;
    private readonly _overlay: HTMLElement;
    private readonly _editorMR: EditorView;
    private readonly _editorAR: VistaEditorAR;
    private _modeloER: ModeloER | null = null;
    private _modeloMaterializado: ModeloRelacionalMaterializado | null = null;

    constructor(contenedor: HTMLElement) {
        this._elementoRaíz = contenedor;

        const mrWrapper = createElement("div", {className: "mr-codemirror-wrapper"});

        this._consola = createElement("div", {className: "mr-consola"});
        this._overlay = createElement("div", {className: "mr-consola-overlay", textContent: "Ejecutando...", style: {display: "none"}});

        this._editorAR = new VistaEditorAR(() => this._ejecutar());

        const topbar = createElement("div", {className: "mr-topbar"}, [
            createElement("span", {className: "mr-topbar-titulo", textContent: "Momodelo"}),
            this._editorAR.elementoSwitcher(),
            createElement("button", {
                className: "mr-btn-ejecutar",
                textContent: "▶︎ Ejecutar",
                title: "Ctrl + Enter",
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

        this._consolaWrapper = createElement("div", {className: "mr-consola-wrapper", style: {display: "none"}}, [
            consolaHeader,
            this._consola,
            this._overlay
        ]);

        const panelMR = createElement("div", {className: "mr-editor-panel"}, [
            createElement("div", {className: "mr-editor-panel-label", textContent: "Modelo Relacional"}),
            mrWrapper
        ]);

        const editores = createElement("div", {className: "mr-editores"}, [
            panelMR,
            this._editorAR.elementoDivisor(),
            this._editorAR.elementoPanel()
        ]);

        const editorWrapper = createElement("div", {className: "mr-editor-wrapper"}, [
            topbar,
            editores,
            this._consolaWrapper
        ]);

        this._elementoRaíz.append(editorWrapper);

        const ejecutarKeymap = Prec.highest(keymap.of([{
            key: "Ctrl-Enter",
            run: () => { this._ejecutar(); return true; }
        }]));

        const tabConEspacios = Prec.highest(keymap.of([{
            key: "Tab",
            run: (view) => {
                view.dispatch(view.state.replaceSelection("   "));
                return true;
            }
        }]));

        this._editorMR = new EditorView({
            extensions: [
                tabConEspacios,
                basicSetup,
                autocompletion({override: [ctx => this._completar(ctx)]}),
                ejecutarKeymap
            ],
            parent: mrWrapper
        });
    }

    arActivo(): boolean {
        return this._editorAR.activo();
    }

    registrarCambioAR(callback: (activo: boolean) => void): void {
        this._editorAR.cuandoCambie = callback;
    }

    get elementoContenedor(): HTMLElement {
        return this._elementoRaíz;
    }

    setModeloER(modeloER: ModeloER | null): void {
        this._modeloER = modeloER;
        this._modeloMaterializado = null;
        this._limpiarConsola();
        this._consolaWrapper.style.display = "none";
    }

    private _ejecutar(): void {
        this._overlay.style.display = "flex";

        requestAnimationFrame(() => setTimeout(() => {
            this._overlay.style.display = "none";
            this._limpiarConsola();
            this._consolaWrapper.style.display = "";

            const inputMR = this._editorMR.state.doc.toString();

            try {
                const programaMR = new AnalizadorSintácticoMR().analizarSintaxisDe(inputMR);
                const programaValidado = new ValidadorSemánticoMR().ejecutarsePara(programaMR, this._modeloER);
                this._modeloMaterializado = new IntérpreteMR().ejecutar(programaValidado);
            } catch (e) {
                this._modeloMaterializado = null;
                if (e instanceof ErrorSintácticoMR) {
                    this._mostrarError(e.message);
                } else if (e instanceof ErroresValidación) {
                    e.errores.forEach(msg => this._mostrarError(msg));
                } else if (e instanceof ErrorPKDuplicada) {
                    this._mostrarError(e.message);
                } else {
                    throw e;
                }
                return;
            }

            if (!this._editorAR.activo() || !this._editorAR.tieneConsulta()) {
                this._mostrarÉxito("[OK] Ejecutado correctamente. No hay resultados para mostrar.");
                return;
            }

            try {
                const resultado = this._editorAR.ejecutar(this._modeloMaterializado!);
                this._renderizarResultado(resultado);
            } catch (e) {
                if (e instanceof ErrorSintácticoAR || e instanceof MomodeloLogicaError) {
                    this._mostrarError(e.message);
                } else {
                    throw e;
                }
            }
        }, 200));
    }

    private _renderizarResultado(resultado: ResultadoConsulta): void {
        const columnas = [...resultado.atributos];
        const thead = createElement("thead", {}, [
            createElement("tr", {}, columnas.map(col => createElement("th", {textContent: col})))
        ]);
        const tbody = createElement("tbody", {}, resultado.tuplas.map(tupla =>
            createElement("tr", {}, columnas.map(col =>
                createElement("td", {textContent: String(tupla[col] ?? "")})
            ))
        ));
        this._consola.append(createElement("table", {className: "mr-tabla-resultado"}, [thead, tbody]));
    }

    private _completar(context: CompletionContext): CompletionResult | null {
        const palabraBuscada = context.matchBefore(/[A-Za-záéíóúÁÉÍÓÚñÑ_]\w*/);
        if (!palabraBuscada || (palabraBuscada.from === palabraBuscada.to && !context.explicit)) return null;

        if (!this._modeloER) return null;
        const palabras = new Set<string>();
        this._modeloER.entidades.forEach(entidad => {
            palabras.add(entidad.nombre());
            entidad.atributos().forEach(atr => palabras.add(atr.nombre()));
        });
        if (palabras.size === 0) return null;

        return {
            from: palabraBuscada.from,
            options: [...palabras].map(label => ({label, type: "keyword"}))
        };
    }

    private _limpiarConsola(): void {
        this._consola.innerHTML = "";
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
