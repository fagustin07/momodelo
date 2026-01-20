import {createElement} from "./vista/dom/createElement.ts";
import {VistaEditorMER} from "./vista/vistaEditorMER.ts";

let botonActivo: HTMLButtonElement | null = null;

export function generarBarraDeInteracciones(vistaEditorMER: VistaEditorMER, elementoRaiz: HTMLElement) {
    const textoSugerencia = createElement("span", {
        className: "texto-sugerencia",
        textContent: "",
    });

    elementoRaiz.addEventListener("fin-interaccion-mer", () => {
        if (botonActivo !== null) {
            botonActivo.classList.remove("boton-activo");
            botonActivo = null;
            setSugerencia("");

            if (document.activeElement instanceof HTMLButtonElement) {
                document.activeElement.blur();
            }
        }
    });

    elementoRaiz.addEventListener("momodelo-relacion-origen",
        () => setSugerencia("Seleccioná la Entidad  Origen (ESC para cancelar)"));

    elementoRaiz.addEventListener("momodelo-relacion-destino",
        () => setSugerencia("Ahora la Entidad Destino (ESC para cancelar)"));

    elementoRaiz.addEventListener("momodelo-crear-entidad",
        () => setSugerencia("Clickeá sobre el diagrama para crear una Entidad (ESC para cancelar)"));

    elementoRaiz.addEventListener("momodelo-borrar-elemento",
        () => setSugerencia("Seleccioná el elemento (ESC para cancelar)"));

    elementoRaiz.addEventListener('inicio-inspector',
        () => setSugerencia("ESC para cerrar inspector"));

    elementoRaiz.addEventListener('fin-inspector',
        () => setSugerencia(""));

        const topbar = createElement("div", {id: "topbar"}, [
            createElement("button", botonCrearEntidad(vistaEditorMER)),
            createElement("button", botonCrearRelacion(elementoRaiz, vistaEditorMER)),
            createElement("button", botonBorrar(vistaEditorMER)),
    ]);

    return createElement("div", {className: "contenedor-barra"}, [topbar, textoSugerencia])
}

function handlearBotonPresionado(boton: HTMLButtonElement, vistaEditorMER: VistaEditorMER, callbackAlPresionarBotonn: () => void) {
    if (botonActivo === boton) {
        boton.classList.remove("boton-activo");
        vistaEditorMER.cancelarInteracción();
        botonActivo = null;
        return;
    }

    if (botonActivo) botonActivo.classList.remove("boton-activo");

    vistaEditorMER.cancelarInteracción();

    boton.classList.add("boton-activo");
    botonActivo = boton;
    callbackAlPresionarBotonn();
}

function botonCrearEntidad(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Entidad",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER,
                () => vistaEditorMER.solicitudCrearEntidad(),
            ),
    };
}

function botonCrearRelacion(elementoRaiz: HTMLElement, vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "+Relacion",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER, () => {
                vistaEditorMER.solicitudCrearRelacion();
            }),
    };
}

function botonBorrar(vistaEditorMER: VistaEditorMER) {
    return {
        textContent: "Borrar",
        onclick: (evento: PointerEvent) =>
            handlearBotonPresionado(evento.currentTarget as HTMLButtonElement, vistaEditorMER, () =>
                vistaEditorMER.solicitudDeBorrado()
            ),
    };
}

function setSugerencia(texto: string) {
    document.getElementsByClassName("texto-sugerencia")[0].textContent = texto;
}
