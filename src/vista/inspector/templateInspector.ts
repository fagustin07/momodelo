import {ElementoMER} from "../../modelo/elementoMER";
import {VistaEditorMER} from "../vistaEditorMER.ts";
import {createElement} from "../dom/createElement.ts";

type TemplateRegistrable = { new(vistaEditor: VistaEditorMER, elemento: ElementoMER): TemplateInspector } & typeof TemplateInspector;
type OpcionDividida = { etiqueta: string; valor: string };

export abstract class TemplateInspector {

    private static readonly _registradas: TemplateRegistrable[] = [];

    protected _inputNombre: HTMLInputElement | null = null;

    protected constructor(
        protected readonly vistaEditor: VistaEditorMER,
        protected readonly elemento: ElementoMER,
    ) {}

    static registrar(clase: TemplateRegistrable): void {
        TemplateInspector._registradas.push(clase);
    }

    static puedeHacerseCargoDe(
        vistaEditor: VistaEditorMER,
        elemento: ElementoMER,
    ): TemplateInspector {
        return new (
            TemplateInspector
                ._registradas
                .find(template => template.puedeManejar(elemento))!)(vistaEditor, elemento)
    }

    static puedeManejar(_elemento: ElementoMER): boolean {
        throw new Error("subclass responsibility");
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
            className: "inspector-titulo",
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
        });
    }

    protected _elementoGrupoDividido(
        opciones: HTMLElement[],
        claseAdicional: string = ""
    ): HTMLElement {
        const clases = [
            "inspector-grupo-teclas",
            "tecla-grupo-segmentado",
            claseAdicional,
        ].filter(Boolean).join(" ");

        return createElement("div", {className: clases}, opciones);
    }

    protected _crearElementoRadioDividido(
        {etiqueta, valor}: OpcionDividida,
        nombre: string,
        estaActivo: boolean,
        alCambiar: (valorSeleccionado: string) => void,
        deshabilitado: boolean = false
    ): HTMLElement {
        return createElement("label", {
            textContent: etiqueta,
            className: "tecla tecla-inactiva",
        }, [
            createElement("input", {
                type: "radio",
                name: nombre,
                value: valor,
                checked: estaActivo,
                disabled: deshabilitado,
                className: "tecla-radio-oculto",
                onchange: evento =>
                    alCambiar((evento.currentTarget as HTMLInputElement).value),
            })
        ]);
    }
}