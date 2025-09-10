import {createElement} from "../vista/dom/createElement.ts";

let contenedorToasts: HTMLElement;

function asegurarContenedorToasts(elementoRaiz: HTMLElement) {
    if (contenedorToasts) return contenedorToasts;

    contenedorToasts = createElement("div", {
        id: "contenedor-toasts",
        style: {
            position: "fixed",
            zIndex: "9999",
            top: "24px",
            right: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "flex-end",
            pointerEvents: "none",
        },
    });

    elementoRaiz.appendChild(contenedorToasts);
    return contenedorToasts;
}

export type TipoToast = "info" | "success" | "warning" | "error";

export function renderizarToast(
    elementoRaiz: HTMLElement,
    mensaje: string,
    {variante = "info", duracion = 2000}: { variante?: TipoToast; duracion?: number } = {}
) {
    const contenedorDeToasts = asegurarContenedorToasts(elementoRaiz);

    const toast = createElement("div", {
        textContent: mensaje,
        style: {
            maxWidth: "25vw",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow: "0 6px 24px rgba(0,0,0,.18)",
            background: elegirColorToast(variante),
            color: "#fff",
            opacity: "0",
            transform: "translateY(-6px)",
            transition: "opacity .18s ease, transform .18s ease",
            pointerEvents: "auto",
            wordBreak: "break-word",
            font: "600 14px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        },
    });

    contenedorDeToasts.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    const temporizador = setTimeout(() => {
        clearTimeout(temporizador);
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-6px)";
        setTimeout(() => toast.remove(), 180);
    }, duracion);
}

function elegirColorToast(variante: TipoToast) {
    switch (variante) {
        case "success":
            return "#16a34a";
        case "warning":
            return "#d97706";
        case "error":
            return "#dc2626";
        default:
            return "#007bff";
    }
}
