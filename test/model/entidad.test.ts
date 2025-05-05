import { describe, it, expect, beforeEach } from "vitest";
import { Entidad } from "../../src/modelo/entidad";
import { coordenada } from "../../src/posicion";

describe("Entidad", () => {
    let entidad: Entidad;

    beforeEach(() => {
        entidad = new Entidad("Pirata", [], coordenada(0, 0));
    });

    it("Dado una entidad inicializada, entonces debería tener un nombre y no atributos", () => {
        expect(entidad.nombre()).toEqual("Pirata");
        expect(entidad.atributos()).toEqual([]);
    });

    it("Dado una entidad inicializada, cuando se cambia el nombre, entonces debería reflejar el nuevo nombre", () => {
        entidad.cambiarNombre("Marinero");

        expect(entidad.nombre()).toEqual("Marinero");
    });

    it("Dado una entidad inicializada, cuando se agrega un atributo, entonces debería tener el nuevo atributo en la lista", () => {
        const atributo = entidad.agregarAtributo("Nombre");

        expect(entidad.atributos()).toEqual([atributo]);
    });

    it("Dado una entidad con un atributo, cuando se renombra el atributo, entonces debería reflejar el nuevo nombre", () => {
        const atr = entidad.agregarAtributo("Nombre");

        entidad.renombrarAtributo(atr, "Apellido");

        expect(entidad.atributos()[0]).toEqual(atr);
        expect(entidad.atributos()[0].nombre()).toEqual("Apellido");
    });
});