import {createElement} from "../vista/dom/createElement.ts";
import {AlmacenamientoLocal, TrabajoGuardado, UMBRAL_ADVERTENCIA} from "../servicios/almacenamientoLocal.ts";
import {importar} from "../servicios/importador.ts";
import {exportar} from "../servicios/exportador.ts";
import {ProveedorDeTrabajo} from "./menuHamburguesa.ts";
import {ModeloER} from "../servicios/modeloER.ts";

export class ModalMisTrabajos {
    private readonly _proveedor: ProveedorDeTrabajo;
    private readonly _almacenamiento: AlmacenamientoLocal;
    private _overlay: HTMLElement | null = null;

    constructor(proveedor: ProveedorDeTrabajo, almacenamiento: AlmacenamientoLocal) {
        this._proveedor = proveedor;
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
        const panel = this._overlay.querySelector(".modal-mis-trabajos-panel");
        if (!panel) return;
        panel.replaceWith(this._construirPanel());
    }

    private _construirOverlay(): HTMLElement {
        const overlay = createElement("div", {
            className: "modal-mis-trabajos-overlay",
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
            className: "modal-mis-trabajos-panel"
        }, children);
    }

    private _construirHeader(): HTMLElement {
        const titulo = createElement("h2", {
            className: "modal-mis-trabajos-titulo",
            textContent: "Mis trabajos"
        });

        const botónCerrar = createElement("button", {
            className: "modal-mis-trabajos-cerrar",
            textContent: "✕",
            ariaLabel: "Cerrar",
            onclick: () => this._cerrar()
        });

        return createElement("div", {
            className: "modal-mis-trabajos-header"
        }, [titulo, botónCerrar]);
    }

    private _construirWarning(): HTMLElement | null {
        if (this._almacenamiento.cantidadTrabajos() <= UMBRAL_ADVERTENCIA) return null;

        return createElement("div", {
            className: "modal-mis-trabajos-warning",
            textContent: `Tenés ${this._almacenamiento.cantidadTrabajos()} trabajos guardados. Considerá eliminar los que ya no uses.`
        });
    }

    private _construirSecciónGuardar(): HTMLElement {
        const input = createElement("input", {
            type: "text",
            className: "modal-mis-trabajos-input-nombre",
            placeholder: "Nombre del trabajo...",
        });

        const botonGuardar = createElement("button", {
            className: "modal-mis-trabajos-boton-guardar",
            textContent: "Guardar trabajo actual",
            onclick: () => {
                const nombre = input.value.trim() || "Sin nombre";
                const modeloER = this._proveedor.getModeloER() ?? new ModeloER([], []);
                const json = exportar(modeloER, this._proveedor.getTextoMR(), this._proveedor.getTextoAR());
                this._almacenamiento.guardarTrabajo(nombre, json);
                input.value = "";
                this._reconstruirContenido();
            }
        });

        return createElement("div", {
            className: "modal-mis-trabajos-seccion-guardar"
        }, [input, botonGuardar]);
    }

    private _construirLista(): HTMLElement {
        const trabajos = this._almacenamiento.listarTrabajos();

        if (trabajos.length === 0) {
            const vacio = createElement("p", {
                className: "modal-mis-trabajos-vacio",
                textContent: "No hay trabajos guardados todavía."
            });
            return createElement("div", {className: "modal-mis-trabajos-lista"}, [vacio]);
        }

        const items = trabajos.map(m => this._construirItemTrabajo(m));
        return createElement("div", {className: "modal-mis-trabajos-lista"}, items);
    }

    private _construirItemTrabajo(trabajo: TrabajoGuardado): HTMLElement {
        return createElement("div", {
            className: "modal-mis-trabajos-item"
        }, [this._construirInfo(trabajo), this._construirAcciones(trabajo)]);
    }

    private _construirInfo(trabajo: TrabajoGuardado): HTMLElement {
        const fecha = new Date(trabajo.últimaActualización).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const nombreSpan = createElement("span", {
            className: "modal-mis-trabajos-nombre",
            textContent: trabajo.nombre,
            title: "Doble click para renombrar"
        });

        nombreSpan.addEventListener("dblclick", () =>
            this._activarRenombramiento(nombreSpan, trabajo)
        );

        const fechaSpan = createElement("span", {
            className: "modal-mis-trabajos-fecha",
            textContent: fecha
        });

        return createElement("div", {
            className: "modal-mis-trabajos-info"
        }, [nombreSpan, fechaSpan]);
    }

    private _activarRenombramiento(nombreSpan: HTMLElement, trabajo: TrabajoGuardado): void {
        const input = createElement("input", {
            type: "text",
            className: "modal-mis-trabajos-input-renombrar",
            value: trabajo.nombre,
        });

        const confirmar = () => {
            input.removeEventListener("blur", confirmar);
            const nuevoNombre = input.value.trim();
            if (nuevoNombre) this._almacenamiento.renombrarTrabajo(trabajo.id, nuevoNombre);
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

    private _construirAcciones(trabajo: TrabajoGuardado): HTMLElement {
        const botonCargar = createElement("button", {
            className: "modal-mis-trabajos-boton modal-mis-trabajos-boton--cargar",
            textContent: "Cargar",
            onclick: () => {
                const datos = this._almacenamiento.cargarTrabajo(trabajo.id);
                if (!datos) return;
                const {entidades, relaciones} = importar(datos);
                this._proveedor.reemplazarModelo(entidades, relaciones);
                this._proveedor.setTextoMR(datos.mr ?? "");
                this._proveedor.setTextoAR(datos.ar ?? "");
                this._cerrar();
            }
        });

        const botonEliminar = createElement("button", {
            className: "modal-mis-trabajos-boton modal-mis-trabajos-boton--eliminar",
            textContent: "Eliminar",
            onclick: () => {
                if (!confirm(`¿Eliminar "${trabajo.nombre}"?`)) return;
                this._almacenamiento.eliminarTrabajo(trabajo.id);
                this._reconstruirContenido();
            }
        });

        return createElement("div", {
            className: "modal-mis-trabajos-acciones"
        }, [botonCargar, botonEliminar]);
    }
}