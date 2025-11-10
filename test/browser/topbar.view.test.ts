import { beforeEach, describe, expect, it } from "vitest";
import { screen, fireEvent } from "@testing-library/dom";
import "../../src/style.css";
import { Entidad } from "../../src/modelo/entidad.ts";
import { coordenada } from "../../src/posicion.ts";
import { VistaEditorMER } from "../../src/vista/vistaEditorMER.ts";
import { init } from "../../src/vista.ts";

function getElementoEntidades(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

describe("[MER] Barra de Interacciones", () => {
    let personaje: Entidad;
    let humorista: Entidad;
    let entidades: Entidad[];
    let vistaEditorMER: VistaEditorMER;
    let elementoRaíz: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaíz = document.createElement('div');
        document.body.append(elementoRaíz);

        personaje = new Entidad("PERSONAJE", [], coordenada(100, 100));
        humorista = new Entidad("HUMORISTA", [], coordenada(300, 500));
        entidades = [personaje, humorista];

        vistaEditorMER = init(elementoRaíz, entidades, []);
    });

    it("Un botón de interacción se visualiza activo al seleccionarlo, dando comienzo a la interacción", () => {
        const botónEntidad = screen.getByRole("button", { name: /\+entidad/i });

        fireEvent.click(botónEntidad);

        expect(botónEntidad).toHaveClass("boton-activo");
        expect(vistaEditorMER.hayUnaInteraccionEnProceso()).toBe(true);
    });

    it("Al deseleccionar un botón de interacción, entonces finaliza la interacción", () => {
        const botónRelación = screen.getByRole("button", { name: /\+relacion/i });
        fireEvent.click(botónRelación);

        fireEvent.click(botónRelación);

        expect(botónRelación).not.toHaveClass("boton-activo");
        expect(vistaEditorMER.hayUnaInteraccionEnProceso()).toBeFalsy;
    });


    it("Se pueden cancelar interacciones en proceso", () => {
        const botónEntidad = screen.getByRole("button", { name: /\+entidad/i });
        fireEvent.click(botónEntidad);

        fireEvent.keyDown(elementoRaíz, { key: 'Escape', code: 'Escape', keyCode: 27 });

        expect(botónEntidad).not.toHaveClass("boton-activo");
        expect(vistaEditorMER.hayUnaInteraccionEnProceso()).toBeFalsy;
    });

    it("Cuando finaliza la interacción asociada a un botón, el mismo se desactiva automáticamente", () => {
        const botónRelación = screen.getByRole("button", { name: /\+relacion/i });

        fireEvent.click(botónRelación);

        const [ent1, ent2] = getElementoEntidades();
        fireEvent.click(ent1);
        fireEvent.click(ent2);

        expect(vistaEditorMER.hayUnaInteraccionEnProceso()).toBeFalsy;
        expect(botónRelación).not.toHaveClass("boton-activo");
    });

    it("Solo un botón puede estar activo a la vez", () => {
        const botónRelación = screen.getByRole("button", { name: /\+relacion/i });
        const botónBorrar = screen.getByRole("button", { name: /borrar/i });
        fireEvent.click(botónRelación);

        fireEvent.click(botónBorrar);
        expect(botónRelación).not.toHaveClass("boton-activo");
        expect(botónBorrar).toHaveClass("boton-activo");
    });

    it("Al terminar la interacción de crear una relación, también se deselecciona el botón", () => {
        const botónRelacion = screen.getByRole("button", { name: /\+relacion/i });
        const [ent1, ent2] = getElementoEntidades();

        fireEvent.click(botónRelacion);
        fireEvent.click(ent1);
        fireEvent.click(ent2);

        expect(vistaEditorMER.modelador.relaciones.length).toBe(1);

        expect(botónRelacion).not.toHaveClass("boton-activo");
    });

});
