import {describe, expect, it} from "vitest";
import {JsonModelo} from "../../src/servicios/exportador.ts";
import {importar} from "../../src/servicios/importador.ts";
import {Cardinalidad, TipoRelacion} from "../../src/tipos/tipos.ts";
import {coordenada, coordenadaInicial} from "../../src/posicion.ts";


describe("Importador", () => {
    it("importa entidades con atributos correctamente", () => {
        const json: JsonModelo = {
            atributos: [
                {id: 1, nombre: "nombre", posicion: coordenada(10, 10), esClavePrimaria: false, esMultivaluado: false},
                {id: 2, nombre: "esMayor?", posicion: coordenada(20, 20), esClavePrimaria: true, esMultivaluado: false},
            ],
            entidades: [
                {id: 100, nombre: "Evaluador", posicion: coordenadaInicial(), atributos: [1], esDebil: false},
                {id: 101, nombre: "Sobrio", posicion: coordenada(100, 100), atributos: [2], esDebil: false}
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
            cardinalidadDestino: ['1', '1'] as Cardinalidad,
            tipo: 'fuerte' as TipoRelacion
        };

        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E1", posicion: coordenadaInicial(), atributos: [], esDebil: false},
                {id: 2, nombre: "E2", posicion: coordenada(100, 100), atributos: [], esDebil: false}
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
            entidadDestino: expect.any(Number),
            tipo: rel.tipoRelacion()
        }).toEqual({
            id: jsonRelacion.id,
            nombre: jsonRelacion.nombre,
            posicion: jsonRelacion.posicion,
            cardinalidadOrigen: jsonRelacion.cardinalidadOrigen,
            cardinalidadDestino: jsonRelacion.cardinalidadDestino,
            entidadOrigen: expect.any(Number),
            entidadDestino: expect.any(Number),
            tipo: jsonRelacion.tipo
        });
    });

    it("lanza error si un atributo no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E", posicion: coordenadaInicial(), atributos: [999], esDebil: false}
            ],
            relaciones: []
        };

        expect(() => importar(json)).toThrow("Atributo con ID 999 no encontrado");
    });

    it("El importador lanza error si una entidad referenciada en relación no existe", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "E1", posicion: coordenadaInicial(), atributos: [], esDebil: false}
            ],
            relaciones: [
                {
                    id: 10, nombre: "Rel", posicion: coordenada(5, 5), entidadOrigen: 1, entidadDestino: 2,
                    cardinalidadOrigen: ['0', 'N'],
                    cardinalidadDestino: ['0', 'N'],
                    tipo: 'fuerte'
                }
            ]
        };

        expect(() => importar(json)).toThrow("Entidad origen o destino no encontrada para la relación " + json.relaciones[0].nombre.toUpperCase());
    });

    it("El importador preserva posiciones de todos los elementos", () => {
        const json: JsonModelo = {
            atributos: [{id: 1, nombre: "Nombre", posicion: coordenada(10, 20), esClavePrimaria: false, esMultivaluado: false}],
            entidades: [{id: 1, nombre: "Chef", posicion: coordenada(100, 200), atributos: [1], esDebil: false}],
            relaciones: []
        };

        const {entidades} = importar(json);
        expect(entidades[0].posicion()).toMatchObject(coordenada(100, 200));
        expect(entidades[0].atributos()[0].posicion()).toMatchObject(coordenada(10, 20));
    });

    it("se cargan correctamente los atributos partes de claves", () => {
        const json: JsonModelo = {
            atributos: [{id: 1, nombre: "Estilo", posicion: coordenada(10, 20), esClavePrimaria: true, esMultivaluado: false}],
            entidades: [{id: 1, nombre: "Pizza", posicion: coordenada(100, 200), atributos: [1], esDebil: false}],
            relaciones: []
        };

        const {entidades} = importar(json);
        expect(entidades[0].atributos()[0].esPK()).toBeTruthy();
    });

    it("se cargan correctamente los atributos multivaluados", () => {
        const json: JsonModelo = {
            atributos: [{id: 1, nombre: "Telefonos", posicion: coordenada(10, 20), esClavePrimaria: false, esMultivaluado: true}],
            entidades: [{id: 1, nombre: "Contacto", posicion: coordenada(100, 200), atributos: [1], esDebil: false}],
            relaciones: []
        };

        const {entidades} = importar(json);
        expect(entidades[0].atributos()[0].esMultivaluado()).toBeTruthy();
    });

    it("se cargan correctamente entidades débiles", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "Cliente", posicion: coordenada(10, 10), atributos: [], esDebil: false},
                {id: 2, nombre: "Pedido", posicion: coordenada(200, 10), atributos: [], esDebil: true}
            ],
            relaciones: []
        };

        const {entidades} = importar(json);
        const entidadFuerte = entidades.find(e => e.nombre() === "Cliente");
        const entidadDebil = entidades.find(e => e.nombre() === "Pedido");

        expect(entidadFuerte!.esDebil()).toBe(false);
        expect(entidadDebil!.esDebil()).toBe(true);
    });

    it("se cargan correctamente relaciones débiles", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "Cliente", posicion: coordenada(10, 10), atributos: [], esDebil: false},
                {id: 2, nombre: "Pedido", posicion: coordenada(200, 10), atributos: [], esDebil: true}
            ],
            relaciones: [
                {
                    id: 10,
                    nombre: "REALIZA",
                    posicion: coordenada(100, 10),
                    entidadOrigen: 2,
                    entidadDestino: 1,
                    cardinalidadOrigen: ['1', '1'],
                    cardinalidadDestino: ['0', 'N'],
                    tipo: 'débil'
                }
            ]
        };

        const {relaciones} = importar(json);
        expect(relaciones).toHaveLength(1);
        expect(relaciones[0].esDebil()).toBe(true);
        expect(relaciones[0].cardinalidadOrigen()).toEqual(['1', '1']);
    });

    it("se cargan correctamente modelos con múltiples entidades y relaciones débiles", () => {
        const json: JsonModelo = {
            atributos: [],
            entidades: [
                {id: 1, nombre: "Konoha", posicion: coordenada(10, 10), atributos: [], esDebil: false},
                {id: 2, nombre: "Genin", posicion: coordenada(200, 10), atributos: [], esDebil: true},
                {id: 3, nombre: "Chunin", posicion: coordenada(400, 10), atributos: [], esDebil: true}
            ],
            relaciones: [
                {
                    id: 10, nombre: "Entrena", posicion: coordenada(100, 10),
                    entidadOrigen: 2, entidadDestino: 1,
                    cardinalidadOrigen: ['1', '1'], cardinalidadDestino: ['0', 'N'],
                    tipo: 'débil'
                },
                {
                    id: 11, nombre: "Asciende", posicion: coordenada(300, 10),
                    entidadOrigen: 3, entidadDestino: 2,
                    cardinalidadOrigen: ['1', '1'], cardinalidadDestino: ['0', 'N'],
                    tipo: 'débil'
                }
            ]
        };

        const {entidades, relaciones} = importar(json);
        expect(entidades.filter(e => e.esDebil()).length).toBe(2);
        expect(relaciones.filter(r => r.esDebil()).length).toBe(2);
        
        const relEntrena = relaciones.find(r => r.nombre() === "Entrena");
        const relAsciende = relaciones.find(r => r.nombre() === "Asciende");
        const entidadKonoha = entidades.find(e => e.nombre() === "Konoha");
        const entidadGenin = entidades.find(e => e.nombre() === "Genin");
        const entidadChunin = entidades.find(e => e.nombre() === "Chunin");

        expect(relEntrena!.entidadOrigen()).toBe(entidadGenin);
        expect(relEntrena!.entidadDestino()).toBe(entidadKonoha);
        expect(relAsciende!.entidadOrigen()).toBe(entidadChunin);
        expect(relAsciende!.entidadDestino()).toBe(entidadGenin);
    });
});
