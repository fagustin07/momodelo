import {coordenada, Posicion} from "./posicion.ts";


export function hacerArrastrable(
    elementoArrastrable: HTMLElement,
    {alAgarrar, alArrastrar, alSoltar, esArrastrable}: {
        alAgarrar?: () => void,
        alArrastrar?: (cursorPosition: Posicion, delta: Posicion) => void,
        alSoltar?: () => void,
        esArrastrable?: () => boolean,
    },
) {
    elementoArrastrable.classList.add("arrastrable");

    elementoArrastrable.addEventListener("pointerdown", (evento: PointerEvent) => {
        if (evento.target !== elementoArrastrable) return;
        if (!(esArrastrable?.() ?? true)) return;

        evento.preventDefault();
        alAgarrar?.();
        elementoArrastrable.setPointerCapture(evento.pointerId);
        elementoArrastrable.classList.add("agarrando");

        const dejarDeArrastar = new AbortController();

        let ultimaPosicion: Posicion = posicionDelClienteDe(evento);

        elementoArrastrable.addEventListener("pointermove", (event: PointerEvent) => {
            if (event.pointerId !== evento.pointerId) return;

            const nuevaPosicion = posicionDelClienteDe(event);
            const delta = ultimaPosicion.desplazamientoHacia(nuevaPosicion);

            alArrastrar?.(nuevaPosicion, delta);

            ultimaPosicion = nuevaPosicion;
        }, {signal: dejarDeArrastar.signal});

        const endDrag = (event: PointerEvent) => {
            if (event.pointerId !== evento.pointerId) return;

            alSoltar?.();
            elementoArrastrable.classList.remove("agarrando");
            dejarDeArrastar.abort();
        };

        elementoArrastrable.addEventListener("pointerup", endDrag, {signal: dejarDeArrastar.signal});
        elementoArrastrable.addEventListener("pointercancel", endDrag, {signal: dejarDeArrastar.signal});
        elementoArrastrable.addEventListener("pointerdown", () => {
            dejarDeArrastar.abort()
        }, {signal: dejarDeArrastar.signal});
    });
}


export function posicionDelClienteDe(event: MouseEvent): Posicion {
    return coordenada(event.clientX, event.clientY);
}