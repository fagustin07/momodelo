import {describe, expect, it} from "vitest";
import {JsonModelo} from "../../src/servicios/exportador.ts";
import {importar} from "../../src/servicios/importador.ts";
import {Cardinalidad} from "../../src/tipos/tipos.ts";
import {coordenada, coordenadaInicial} from "../../src/posicion.ts";


describe("Importador", () => {
    it("importa entidades con atributos correctamente", () => {
        const json: JsonModelo = {
            atributos: [
                {id: 1, nombre: "nombre", posicion: coordenada(10, 10), esClavePrimaria: false},
                {id: 2, nombre: "esMayor?", posicion: coordenada(20, 20), esClavePrimaria: true},
            ],
            entidades: [
                {id: 100, nombre: "Evaluador", posicion: coordenadaInicial(), atributos: [1]},
                {id: 101, nombre: "Sobrio", posicion: coordenada(100, 100), atributos: [2]}
            ],
            relaciones: []
        };

        const {entidades, relaciones} = importar(json);

        expect(entidades).toHaveLength(2);
        expect(entidades[0].nombre()).toBe("Evaluador");
        expect(entidades[0].atributos()[0].nombre()).toBe("nombre");
        expect(entidades[1].atributos()[0].posicion()).toMatchObject(coordenada(20, 20));
        expect(relaciones).toHaveLength(0);
    });

    it("importa relaciones entre entidades correctamente", () => {
        const jsonRelacion = {
            id: 50,
            nombre: "RelacionX",
            posicion: coordenada(50, 50),
            entidadOrigen: 1,
            entidadDestino: 2,
            cardinalidadOrigen: ['0', 'N'] as Cardinalidad,
            cardinalidadDestino: ['1', '1'] as Cardinalidad
        };

        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E1", posicion: coordenadaInicial(), atributos: []},
                {id: 2, nombre: "E2", posicion: coordenada(100, 100), atributos: []}
            ],
            relaciones: [jsonRelacion]
        };

        const {relaciones} = importar(json);
        const rel = relaciones[0];

        expect({
            id: expect.any(Number),
            nombre: rel.nombre(),
            posicion: rel.posicion(),
            cardinalidadOrigen: rel.cardinalidadOrigen(),
            cardinalidadDestino: rel.cardinalidadDestino(),
            entidadOrigen: expect.any(Number),
            entidadDestino: expect.any(Number)
        }).toEqual(jsonRelacion);
    });

    it("lanza error si un atributo no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E", posicion: coordenadaInicial(), atributos: [999]}
            ],
            relaciones: []
        };

        expect(() => importar(json)).toThrow("Atributo con ID 999 no encontrado");
    });

    it("El importador lanza error si una entidad referenciada en relación no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E1", posicion: coordenadaInicial(), atributos: []}
            ],
            relaciones: [
                {
                    id: 10, nombre: "Rel", posicion: coordenada(5, 5), entidadOrigen: 1, entidadDestino: 2,
                    cardinalidadOrigen: ['0', 'N'],
                    cardinalidadDestino: ['0', 'N']
                }
            ]
        };

        expect(() => importar(json)).toThrow("Entidad origen o destino no encontrada para la relación " + json.relaciones[0].nombre.toUpperCase());
    });

    it("El importador preserva posiciones de todos los elementos", () => {
        const json: JsonModelo = {
            atributos: [{id: 1, nombre: "Nombre", posicion: coordenada(10, 20), esClavePrimaria: false}],
            entidades: [{id: 1, nombre: "Chef", posicion: coordenada(100, 200), atributos: [1]}],
            relaciones: []
        };

        const {entidades} = importar(json);
        expect(entidades[0].posicion()).toMatchObject(coordenada(100, 200));
        expect(entidades[0].atributos()[0].posicion()).toMatchObject(coordenada(10, 20));
    });

    it("se cargan correctamente los atributos partes de claves", () => {
        const json: JsonModelo = {
            atributos: [{id: 1, nombre: "Estilo", posicion: coordenada(10, 20), esClavePrimaria: true}],
            entidades: [{id: 1, nombre: "Pizza", posicion: coordenada(100, 200), atributos: [1]}],
            relaciones: []
        };

        const {entidades} = importar(json);
        expect(entidades[0].atributos()[0].esPK()).toBe(true);
    });
});
