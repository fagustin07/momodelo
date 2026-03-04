import {createElement} from "../vista/dom/createElement.ts";
import {AlmacenamientoLocal, ModeloGuardado, UMBRAL_ADVERTENCIA} from "../servicios/almacenamientoLocal.ts";
import {importar} from "../servicios/importador.ts";
import {exportar} from "../servicios/exportador.ts";
import {VistaEditorMER} from "../vista/vistaEditorMER.ts";

export class ModalMisModelos {
    private readonly _almacenamiento: AlmacenamientoLocal;
    private readonly _vistaEditor: VistaEditorMER;
    private _overlay: HTMLElement | null = null;

    constructor(vistaEditor: VistaEditorMER, almacenamiento: AlmacenamientoLocal) {
        this._vistaEditor = vistaEditor;
        this._almacenamiento = almacenamiento;
    }

    abrir(): void {
        this._overlay = this._construirOverlay();
        document.body.appendChild(this._overlay);
        this._overlay.classList.add("modal-abierto");
    }

    private _cerrar(): void {
        if (!this._overlay) return;
        const overlay = this._overlay;
        this._overlay = null;
        overlay.classList.remove("modal-abierto");
        overlay.addEventListener("transitionend", () => overlay.remove(), {once: true});
    }

    private _reconstruirContenido(): void {
        if (!this._overlay) return;
        const panel = this._overlay.querySelector(".modal-mis-modelos-panel");
        if (!panel) return;
        panel.replaceWith(this._construirPanel());
    }

    private _construirOverlay(): HTMLElement {
        const overlay = createElement("div", {
            className: "modal-mis-modelos-overlay",
            onclick: (e: MouseEvent) => {
                if (e.target === overlay) this._cerrar();
            }
        }, [this._construirPanel()]);
        return overlay;
    }

    private _construirPanel(): HTMLElement {
        const header = this._construirHeader();
        const warning = this._construirWarning();
        const secciónGuardar = this._construirSecciónGuardar();
        const lista = this._construirLista();

        const children = warning
            ? [header, warning, secciónGuardar, lista]
            : [header, secciónGuardar, lista];

        return createElement("div", {
            className: "modal-mis-modelos-panel"
        }, children);
    }

    private _construirHeader(): HTMLElement {
        const titulo = createElement("h2", {
            className: "modal-mis-modelos-titulo",
            textContent: "Mis Modelos"
        });

        const botónCerrar = createElement("button", {
            className: "modal-mis-modelos-cerrar",
            textContent: "✕",
            ariaLabel: "Cerrar",
            onclick: () => this._cerrar()
        });

        return createElement("div", {
            className: "modal-mis-modelos-header"
        }, [titulo, botónCerrar]);
    }

    private _construirWarning(): HTMLElement | null {
        if (this._almacenamiento.cantidadModelos() <= UMBRAL_ADVERTENCIA) return null;

        return createElement("div", {
            className: "modal-mis-modelos-warning",
            textContent: `Tenés ${this._almacenamiento.cantidadModelos()} modelos guardados. Considerá eliminar los que ya no uses.`
        });
    }

    private _construirSecciónGuardar(): HTMLElement {
        const input = createElement("input", {
            type: "text",
            className: "modal-mis-modelos-input-nombre",
            placeholder: "Nombre del modelo...",
        });

        const botonGuardar = createElement("button", {
            className: "modal-mis-modelos-boton-guardar",
            textContent: "Guardar modelo actual",
            onclick: () => {
                const nombre = input.value.trim() || "Sin nombre";
                const json = exportar(this._vistaEditor.modeloER);
                this._almacenamiento.guardarModelo(nombre, json);
                input.value = "";
                this._reconstruirContenido();
            }
        });

        return createElement("div", {
            className: "modal-mis-modelos-seccion-guardar"
        }, [input, botonGuardar]);
    }

    private _construirLista(): HTMLElement {
        const modelos = this._almacenamiento.listarModelos();

        if (modelos.length === 0) {
            const vacio = createElement("p", {
                className: "modal-mis-modelos-vacio",
                textContent: "No hay modelos guardados todavía."
            });
            return createElement("div", {className: "modal-mis-modelos-lista"}, [vacio]);
        }

        const items = modelos.map(m => this._construirItemModelo(m));
        return createElement("div", {className: "modal-mis-modelos-lista"}, items);
    }

    private _construirItemModelo(modelo: ModeloGuardado): HTMLElement {
        return createElement("div", {
            className: "modal-mis-modelos-item"
        }, [this._construirInfo(modelo), this._construirAcciones(modelo)]);
    }

    private _construirInfo(modelo: ModeloGuardado): HTMLElement {
        const fecha = new Date(modelo.últimaActualización).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const nombreSpan = createElement("span", {
            className: "modal-mis-modelos-nombre",
            textContent: modelo.nombre,
            title: "Doble click para renombrar"
        });

        nombreSpan.addEventListener("dblclick", () =>
            this._activarRenombramiento(nombreSpan, modelo)
        );

        const fechaSpan = createElement("span", {
            className: "modal-mis-modelos-fecha",
            textContent: fecha
        });

        return createElement("div", {
            className: "modal-mis-modelos-info"
        }, [nombreSpan, fechaSpan]);
    }

    private _activarRenombramiento(nombreSpan: HTMLElement, modelo: ModeloGuardado): void {
        const input = createElement("input", {
            type: "text",
            className: "modal-mis-modelos-input-renombrar",
            value: modelo.nombre,
        });

        const confirmar = () => {
            input.removeEventListener("blur", confirmar);
            const nuevoNombre = input.value.trim();
            if (nuevoNombre) this._almacenamiento.renombrarModelo(modelo.id, nuevoNombre);
            this._reconstruirContenido();
        };

        const cancelar = () => {
            input.removeEventListener("blur", confirmar);
            this._reconstruirContenido();
        };

        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") confirmar();
            if (e.key === "Escape") cancelar();
        });
        input.addEventListener("blur", confirmar);

        nombreSpan.replaceWith(input);
        input.focus();
        input.select();
    }

    private _construirAcciones(modelo: ModeloGuardado): HTMLElement {
        const botonCargar = createElement("button", {
            className: "modal-mis-modelos-boton modal-mis-modelos-boton--cargar",
            textContent: "Cargar",
            onclick: () => {
                const datos = this._almacenamiento.cargarModelo(modelo.id);
                if (!datos) return;
                const {entidades, relaciones} = importar(datos);
                this._vistaEditor.reemplazarModelo(entidades, relaciones);
                this._cerrar();
            }
        });

        const botonEliminar = createElement("button", {
            className: "modal-mis-modelos-boton modal-mis-modelos-boton--eliminar",
            textContent: "Eliminar",
            onclick: () => {
                if (!confirm(`¿Eliminar "${modelo.nombre}"?`)) return;
                this._almacenamiento.eliminarModelo(modelo.id);
                this._reconstruirContenido();
            }
        });

        return createElement("div", {
            className: "modal-mis-modelos-acciones"
        }, [botonCargar, botonEliminar]);
    }
}
