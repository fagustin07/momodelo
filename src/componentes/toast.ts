import {createElement} from "../vista/dom/createElement.ts";

export function renderizarToast(
    elementoRaiz: HTMLElement,
    mensaje: string,
    tipo: 'error' | 'warning' = 'error',
) {
    const contenedorDeToasts = contenedorToastEn(elementoRaiz);
    const fondos = { error: '#dc3545', warning: '#ffc107' };

    const toast = createElement("div", {
        textContent: mensaje,
        className: "toast",
        style: { background: fondos[tipo] },
    });

    contenedorDeToasts.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    const temporizador = setTimeout(() => {
        clearTimeout(temporizador);
        toast.remove();
    }, 3500);
}

const idContenedorHTML = 'contenedor-toast';

function contenedorToastEn(elementoRaiz: HTMLElement): HTMLElement {
    let contenedor = document.getElementById(idContenedorHTML);
    if (contenedor !== null) {
        return contenedor
    } else {
        contenedor = createElement("div", {
            id: idContenedorHTML,
        });
    }

    elementoRaiz.appendChild(contenedor);
    return contenedor;
}