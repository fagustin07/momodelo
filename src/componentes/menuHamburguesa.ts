import {createElement, createSvgElement} from "../vista/dom/createElement.ts";
import {exportar} from "../servicios/exportador.ts";
import {importar} from "../servicios/importador.ts";
import {VistaEditorMER} from "../vista/vistaEditorMER.ts";

export class MenuHamburguesa {
    private readonly _vistaEditor: VistaEditorMER;
    private readonly _menúContainer: HTMLElement;
    private readonly _menuDesplegable: HTMLElement;
    private readonly _inputJson: HTMLInputElement;
    private _menuAbierto = false;

    constructor(vistaEditor: VistaEditorMER) {
        this._vistaEditor = vistaEditor;

        this._inputJson = createElement("input", {
            type: "file",
            accept: ".json",
            className: "menu-hamburguesa-input",
            onchange: async (event: Event) => this._handlearImportacion(event)
        });

        this._menuDesplegable = this._crearMenuDesplegable();
        const icono = this._crearIconoHamburguesa();

        this._menúContainer = createElement("div", {
            className: "menu-hamburguesa-container"
        }, [icono, this._menuDesplegable, this._inputJson]);

        document.addEventListener("click", (e) => this._handlearClickFuera(e));
    }

    representarseEn(elementoRaíz: HTMLElement): void {
        elementoRaíz.prepend(this._menúContainer);
    }

    private _crearIconoHamburguesa(): HTMLElement {
        const linea1 = createSvgElement("line", {
            x1: 3,
            y1: 6,
            x2: 21,
            y2: 6
        });
        
        const linea2 = createSvgElement("line", {
            x1: 3,
            y1: 12,
            x2: 21,
            y2: 12
        });
        
        const linea3 = createSvgElement("line", {
            x1: 3,
            y1: 18,
            x2: 21,
            y2: 18
        });
        
        const svg = createSvgElement("svg", {
            viewBox: "0 0 24 24",
            width: 24,
            height: 24,
            fill: "none",
            stroke: "currentColor",
            "stroke-width": 2,
        }, [linea1, linea2, linea3]);

        return createElement("button", {
            className: "menu-hamburguesa-icono",
            onclick: (e: MouseEvent) => this._toggleMenu(e),
            ariaLabel: "Menú de opciones"
        }, [svg]);
    }

    private _crearMenuDesplegable(): HTMLElement {
        const botonExportar = createElement("button", {
            className: "menu-item",
            textContent: "Exportar modelo",
            onclick: () => this._exportarModelo()
        });

        const botonImportar = createElement("button", {
            className: "menu-item",
            textContent: "Importar modelo",
            onclick: () => this._importarModelo()
        });

        return createElement("div", {
            className: "menu-hamburguesa-desplegable"
        }, [botonExportar, botonImportar]);
    }

    private _toggleMenu(e: MouseEvent): void {
        e.stopPropagation();
        this._menuAbierto = !this._menuAbierto;
        
        if (this._menuAbierto) {
            this._menuDesplegable.classList.add("abierto");
        } else {
            this._menuDesplegable.classList.remove("abierto");
        }
    }

    private _cerrarMenu(): void {
        this._menuAbierto = false;
        this._menuDesplegable.classList.remove("abierto");
    }

    private _handlearClickFuera(e: Event): void {
        if (!this._menúContainer.contains(e.target as Node)) {
            this._cerrarMenu();
        }
    }

    private _exportarModelo(): void {
        this._cerrarMenu();
        this._vistaEditor.cancelarInteracción();

        const json = exportar(this._vistaEditor.modelador);
        const blob = new Blob([JSON.stringify(json, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString()
            .replace(/T/, "_")
            .replace(/:/g, "-")
            .replace(/\..+/, "");

        const a = document.createElement("a");
        a.href = url;
        a.download = `MER_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    private _importarModelo(): void {
        this._cerrarMenu();
        this._vistaEditor.cancelarInteracción();
        this._inputJson.click();
    }

    private async _handlearImportacion(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const text = await file.text();
        const json = JSON.parse(text);

        const {entidades, relaciones} = importar(json);
        this._vistaEditor.reemplazarModelo(entidades, relaciones);

        input.value = "";
    }
}
