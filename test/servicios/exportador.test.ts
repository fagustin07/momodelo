import {describe, expect, it} from "vitest";
import {coordenada, coordenadaInicial} from "../../src/posicion.ts";
import {Entidad} from "../../src/modelo/entidad.ts";
import {exportar} from "../../src/servicios/exportador.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {Atributo} from "../../src/modelo/atributo.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

describe("Exportador", () => {

    it("exporta una entidad sin atributos", () => {
        const entidad = new Entidad("E", [], coordenada(10, 20));
        const modelo = new Modelador([entidad]);
        const json = exportar(modelo);

        expect(json.entidades).toHaveLength(1);
        expect(json.atributos).toHaveLength(0);
        expect(json.entidades[0]).toMatchObject({
            nombre: "E",
            posicion: {x: 10, y: 20},
            atributos: []
        });
    });

    it("exporta entidad con atributos", () => {
        const atributo1 = new Atributo("a", coordenadaInicial());
        const atributo2 = new Atributo("b", coordenada(5, 5));
        const entidad = new Entidad("E", [atributo1, atributo2], coordenada(10, 10));
        const modelo = new Modelador([entidad]);
        const json = exportar(modelo);

        expect(json.atributos).toHaveLength(2);
        const attrIds = json.entidades[0].atributos;
        expect(attrIds).toHaveLength(2);
        expect(json.atributos.map(a => a.nombre)).toContain("a");
        expect(json.atributos.map(a => a.nombre)).toContain("b");
    });

    it("exporta múltiples relaciones con entidades correctas", () => {
        const entidad1 = new Entidad("E1", [], coordenadaInicial());
        const entidad2 = new Entidad("E2", [], coordenada(100, 100));
        const entidad3 = new Entidad("E3", [], coordenada(200, 200));
        const relacion1 = new Relacion(entidad1, entidad2, "R1", ['0', '1'], ['1', 'N'], coordenada(50, 50));
        const relacion2 = new Relacion(entidad2, entidad3, "R2", ['1', '1'], ['0', 'N'], coordenada(150, 150));
        const relacion3 = new Relacion(entidad1, entidad3, "R3", ['1', 'N'], ['1', 'N'], coordenada(100, 100));

        const relacionesOriginales = [relacion1, relacion2, relacion3];
        const json = exportar(new Modelador([entidad1, entidad2, entidad3], relacionesOriginales));

        expect(json.relaciones).toHaveLength(relacionesOriginales.length);

        expect(json.relaciones).toEqual(expect.arrayContaining(
            relacionesOriginales.map(rel => expect.objectContaining({
                id: rel.id(),
                nombre: rel.nombre(),
                posicion: rel.posicion(),
                cardinalidadOrigen: rel.cardinalidadOrigen(),
                cardinalidadDestino: rel.cardinalidadDestino(),
                entidadOrigen: rel.entidadOrigen().id(),
                entidadDestino: rel.entidadDestino().id()
            }))
        ));

        const ids = json.relaciones.map(r => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });


    it("asigna ids únicos", () => {
        const atributo = new Atributo("codigo", coordenadaInicial());
        const entidad = new Entidad("Producto", [atributo], coordenadaInicial());
        const modelo = new Modelador([entidad]);
        const json = exportar(modelo);

        const entidadId = json.entidades[0].id;
        const atributoId = json.atributos[0].id;
        expect(entidadId).not.toBe(atributoId);
        expect(json.entidades[0].atributos).toContain(atributoId);
    });

    it("se guardan correctamente los atributos marcados como clave primaria", () => {
        const atributoPK = new Atributo("codigo", coordenadaInicial());
        const entidadConPK = new Entidad("Producto", [atributoPK], coordenadaInicial());
        entidadConPK.marcarComoParteDeClaveA(atributoPK);
        const modelo = new Modelador([entidadConPK]);

        const json = exportar(modelo);

        expect(json.atributos[0].esClavePrimaria).toBeTruthy();
    });

    it("se guardan correctamente los atributos marcados como multivaluados", () => {
        const atributoMultivaluado = new Atributo("telefono", coordenadaInicial());
        const entidad = new Entidad("Cliente", [atributoMultivaluado], coordenadaInicial());
        const modelo = new Modelador([entidad]);
        entidad.marcarComoMultivaluadoA(atributoMultivaluado);

        const json = exportar(modelo);

        expect(json.atributos[0].esMultivaluado).toBeTruthy();
    });
});
