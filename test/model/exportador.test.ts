import {describe, expect, it} from "vitest";
import {coordenada} from "../../src/posicion.ts";
import {Entidad} from "../../src/modelo/entidad.ts";
import {exportar} from "../../src/servicios/exportador.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {Atributo} from "../../src/modelo/atributo.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

describe("Exportador", () => {
    const pos = (x: number, y: number) => coordenada(x, y);

    it("exporta una entidad sin atributos", () => {
        const entidad = new Entidad("E", [], pos(10, 20));
        const modelo = new Modelador([entidad]);
        const json = exportar(modelo);

        expect(json.entidades).toHaveLength(1);
        expect(json.atributos).toHaveLength(0);
        expect(json.entidades[0]).toMatchObject({
            nombre: "E",
            posicion: { x: 10, y: 20 },
            atributos: []
        });
    });

    it("exporta entidad con atributos", () => {
        const a1 = new Atributo("a", pos(0, 0));
        const a2 = new Atributo("b", pos(5, 5));
        const entidad = new Entidad("E", [a1, a2], pos(10, 10));
        const modelo = new Modelador([entidad]);
        const json = exportar(modelo);

        expect(json.atributos).toHaveLength(2);
        const attrIds = json.entidades[0].atributos;
        expect(attrIds).toHaveLength(2);
        expect(json.atributos.map(a => a.nombre)).toContain("a");
        expect(json.atributos.map(a => a.nombre)).toContain("b");
    });

    it("exporta múltiples relaciones con entidades correctas", () => {
        const e1 = new Entidad("E1", [], pos(0, 0));
        const e2 = new Entidad("E2", [], pos(100, 100));
        const e3 = new Entidad("E3", [], pos(200, 200));

        const r1 = new Relacion("R1", e1, e2, pos(50, 50));
        const r2 = new Relacion("R2", e2, e3, pos(150, 150));
        const r3 = new Relacion("R3", e1, e3, pos(100, 100));

        const modelo = new Modelador([e1, e2, e3], [r1, r2, r3]);
        const json = exportar(modelo);

        expect(json.relaciones).toHaveLength(3);

        expect(json.relaciones.map(r => r.nombre)).toEqual(expect.arrayContaining(["R1", "R2", "R3"]));
        expect(json.relaciones.map(r => r.posicion)).toEqual(expect.arrayContaining([
            { x: 50, y: 50 },
            { x: 150, y: 150 },
            { x: 100, y: 100 }
        ]));

        const entidadIds = json.entidades.map(e => e.id);
        json.relaciones.forEach(rel => {
            expect(entidadIds).toContain(rel.entidadOrigen);
            expect(entidadIds).toContain(rel.entidadDestino);
        });

        const ids = json.relaciones.map(r => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });


    it("asigna ids únicos y coherentes", () => {
        const a = new Atributo("a", pos(1, 1));
        const e = new Entidad("E", [a], pos(0, 0));
        const modelo = new Modelador([e]);
        const json = exportar(modelo);

        const entidadId = json.entidades[0].id;
        const atributoId = json.atributos[0].id;
        expect(entidadId).not.toBe(atributoId);
        expect(json.entidades[0].atributos).toContain(atributoId);
    });
});
