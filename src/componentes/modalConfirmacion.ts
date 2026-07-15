import {createElement} from "../vista/dom/createElement.ts";

interface OpcionesModalConfirmación {
    mensajeInformativo: HTMLElement;
    alConfirmar: () => void;
    alCancelar: () => void;
}

export function mostrarModalConfirmacion(opciones: OpcionesModalConfirmación): void {
    const {mensajeInformativo, alConfirmar, alCancelar} = opciones;

    mensajeInformativo.append(" ¿Confirmás esta acción?");

    const cerrar = (confirmada: boolean) => {
        document.removeEventListener("keydown", cerrarConEscape, {capture: true});
        overlay.remove();
        confirmada ? alConfirmar() : alCancelar();
    };

    const cerrarConEscape = (evento: KeyboardEvent) => {
        if (evento.key !== "Escape") return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        cerrar(false);
    };

    const botonCancelar = createElement("button", {
        className: "modal-confirmacion-boton modal-confirmacion-boton--cancelar",
        textContent: "Cancelar",
        onclick: () => cerrar(false),
    });
    const botonConfirmar = createElement("button", {
        className: "modal-confirmacion-boton modal-confirmacion-boton--confirmar",
        textContent: "Confirmar",
        onclick: () => cerrar(true),
    });

    const panel = createElement("div", {
        className: "modal-confirmacion-panel",
        role: "dialog",
        ariaModal: "true",
        ariaLabel: "Confirmar esta acción",
    }, [
        mensajeInformativo,
        createElement("div", {className: "modal-confirmacion-acciones"}, [botonCancelar, botonConfirmar]),
    ]);

    const overlay = createElement("div", {
        className: "modal-confirmacion-overlay",
        onclick: (evento: MouseEvent) => {
            if (evento.target === overlay) cerrar(false);
        },
    }, [panel]);

    document.addEventListener("keydown", cerrarConEscape, {capture: true});
    document.body.append(overlay);
}