import {point, Posicion} from "./posicion.ts";


export function hacerArrastrable(
    elementoArrastrable: HTMLElement,
    {alAgarrar, alArrastrar, alSoltar}: {
        alAgarrar?: () => void,
        alArrastrar?: (cursorPosition: Posicion, delta: Posicion) => void,
        alSoltar?: () => void,
    },
) {
    elementoArrastrable.classList.add("arrastrable");

    function grab(pointerId: number, grabPosition: Posicion) {
        alAgarrar?.();
        elementoArrastrable.setPointerCapture(pointerId);
        elementoArrastrable.classList.add("agarrando");

        const dejarDeArrastar = new AbortController();

        let ultimaPosicion: Posicion = grabPosition;

        elementoArrastrable.addEventListener("pointermove", (event: PointerEvent) => {
            if (event.pointerId !== pointerId) return;

            const nuevaPosicion = posicionDelClienteDe(event);
            const delta = ultimaPosicion.desplazamientoHacia(nuevaPosicion);

            alArrastrar?.(nuevaPosicion, delta);

            ultimaPosicion = nuevaPosicion;
        }, {signal: dejarDeArrastar.signal});

        const endDrag = (event: PointerEvent) => {
            if (event.pointerId !== pointerId) return;

            alSoltar?.();
            elementoArrastrable.classList.remove("agarrando");
            dejarDeArrastar.abort();
        };

        elementoArrastrable.addEventListener("pointerup", endDrag, {signal: dejarDeArrastar.signal});
        elementoArrastrable.addEventListener("pointercancel", endDrag, {signal: dejarDeArrastar.signal});
        elementoArrastrable.addEventListener("pointerdown", () => { dejarDeArrastar.abort() }, {signal: dejarDeArrastar.signal});
    }

    elementoArrastrable.addEventListener("pointerdown", (evento: PointerEvent) => {
        if (evento.target !== elementoArrastrable) return;

        evento.preventDefault();
        grab(evento.pointerId, posicionDelClienteDe(evento));
    });

    return grab;
}


export function posicionDelClienteDe(event: MouseEvent): Posicion {
    return point(event.clientX, event.clientY);
}