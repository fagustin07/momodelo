import { describe, it, expect } from "vitest";
import {JsonModelo} from "../../src/servicios/exportador.ts";
import {importar} from "../../src/servicios/importador.ts";

const pos = (x: number, y: number) => ({ x, y });

describe("Importador", () => {
    it("importa entidades con atributos correctamente", () => {
        const json: JsonModelo = {
            atributos: [
                { id: 1, nombre: "a1", posicion: pos(10, 10) },
                { id: 2, nombre: "a2", posicion: pos(20, 20) }
            ],
            entidades: [
                { id: 100, nombre: "Entidad1", posicion: pos(0, 0), atributos: [1] },
                { id: 101, nombre: "Entidad2", posicion: pos(100, 100), atributos: [2] }
            ],
            relaciones: []
        };

        const {entidades, relaciones} = importar(json);

        expect(entidades).toHaveLength(2);
        expect(entidades[0].nombre()).toBe("Entidad1");
        expect(entidades[0].atributos()[0].nombre()).toBe("a1");
        expect(entidades[1].atributos()[0].posicion()).toMatchObject(pos(20, 20));
        expect(relaciones).toHaveLength(0);
    });

    it("importa relaciones entre entidades", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                { id: 1, nombre: "E1", posicion: pos(0, 0), atributos: [] },
                { id: 2, nombre: "E2", posicion: pos(100, 100), atributos: [] }
            ],
            relaciones: [
                {
                    id: 50,
                    nombre: "RelacionX",
                    posicion: pos(50, 50),
                    entidadOrigen: 1,
                    entidadDestino: 2
                }
            ]
        };

        const { entidades, relaciones } = importar(json);

        expect(entidades).toHaveLength(2);
        expect(relaciones).toHaveLength(1);
        expect(relaciones[0].nombre()).toBe("RelacionX");
        expect(relaciones[0].entidades()[0].nombre()).toBe("E1");
        expect(relaciones[0].entidades()[1].nombre()).toBe("E2");
    });

    it("lanza error si un atributo no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                { id: 1, nombre: "E", posicion: pos(0, 0), atributos: [999] }
            ],
            relaciones: []
        };

        expect(() => importar(json)).toThrow("Atributo con ID 999 no encontrado");
    });

    it("El importador lanza error si una entidad referenciada en relación no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                { id: 1, nombre: "E1", posicion: pos(0, 0), atributos: [] }
            ],
            relaciones: [
                { id: 10, nombre: "Rel", posicion: pos(5, 5), entidadOrigen: 1, entidadDestino: 2 }
            ]
        };

        expect(() => importar(json)).toThrow("Entidad origen o destino no encontrada para la relación " + json.relaciones[0].nombre.toUpperCase());
    });

    it("El importador preserva posiciones de todos los elementos", () => {
        const json: JsonModelo = {
            atributos: [{ id: 1, nombre: "a", posicion: pos(10, 20) }],
            entidades: [{ id: 1, nombre: "E", posicion: pos(100, 200), atributos: [1] }],
            relaciones: []
        };

        const { entidades } = importar(json);
        expect(entidades[0].posicion()).toMatchObject(pos(100, 200));
        expect(entidades[0].atributos()[0].posicion()).toMatchObject(pos(10, 20));
    });
});
