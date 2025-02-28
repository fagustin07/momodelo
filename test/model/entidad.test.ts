import { describe, it, expect, beforeEach } from "vitest";
import { Entidad } from "../../src/modelo/entidad";
import { coordenada } from "../../src/posicion";
import {Atributo} from "../../src/modelo/atributo.ts";

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
        const atributoARenombrar = entidad.agregarAtributo("Nombre");
        const atributoPrevioARenombre = entidad.atributos()[0];

        const atributoRenombrado = entidad.renombrarAtributo(atributoPrevioARenombre, "Apellido");

        expect(atributoPrevioARenombre).toEqual(atributoARenombrar);
        expect(entidad.atributos()).toEqual([atributoRenombrado]);
    });
});