import {describe, expect, it} from "vitest";
import {IntérpreteAR} from "../../src/ar/intérpreteAR.ts";
import {NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado} from "../../src/mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../../src/ar/resultadoConsulta.ts";
import {MomodeloLogicaError} from "../../src/servicios/errores.ts";
import {definición, fila, inserción, pk, relación, simple} from "../mr/helpers.ts";
import {IntérpreteMR} from "../../src/mr/interpretadorMR.ts";
import {ValidadorSemánticoMR} from "../../src/mr/validadorSemanticoMR.ts";
import {programa} from "../mr/helpers.ts";
import {SentenciaMR} from "../../src/mr/sentenciaMR.ts";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";
import {AnalizadorSintácticoMR} from "../../src/mr/analizadorSintacticoMR.ts";

describe("[Álgebra Relacional] Intérprete AR", () => {
    function modeloDesdeMR(textoMR: string): ModeloRelacionalMaterializado {
        const prog = new AnalizadorSintácticoMR().analizarSintaxisDe(textoMR);
        return new IntérpreteMR().ejecutar(
            new ValidadorSemánticoMR().ejecutarsePara(prog, null)
        );
    }

    function modeloConRelaciones(...sentencias: SentenciaMR[]): ModeloRelacionalMaterializado {
        return new IntérpreteMR().ejecutar(
            new ValidadorSemánticoMR().ejecutarsePara(programa(...sentencias), null)
        );
    }

    const intérprete = new IntérpreteAR();

    it("un NombreDeRelación retorna un resultado con las tuplas de la relación", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"))),
            inserción("PERSONA", fila(1, "Ana")),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("PERSONA"), modelo);
        expect(resultado).toBeInstanceOf(ResultadoConsulta);
        expect(resultado.nombre).toBe("PERSONA");
        expect(resultado.tuplas).toHaveLength(1);
    });

    it("la búsqueda por nombre es insensible a mayúsculas y minúsculas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CLIENTE", pk("id"))),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("cliente"), modelo);
        expect(resultado.nombre).toBe("CLIENTE");
    });

    it("un nombre de relación inexistente lanza una excepción", () => {
        const modelo = new ModeloRelacionalMaterializado();
        expect(() =>
            intérprete.ejecutar(new NombreDeRelación("INEXISTENTE"), modelo)
        ).toThrow(MomodeloLogicaError);
    });

    it("una selección retorna solo las tuplas que satisfacen la condición de igualdad", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Quilmes", 4.9)),
            inserción("CERVEZA", fila(2, "Stella", 5.2)),
            inserción("CERVEZA", fila(3, "Quilmes", 5.0)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<marca='Quilmes'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
        expect(resultado.tuplas.every(t => t["marca"] === "Quilmes")).toBe(true);
    });

    it("una selección con condición que no satisface ninguna tupla retorna resultado vacío", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"))),
            inserción("CERVEZA", fila(1, "Quilmes")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<marca='Corona'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(0);
    });

    it("una selección con comparación numérica retorna las tuplas cuyo atributo supera el umbral", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Baja", 3.5)),
            inserción("CERVEZA", fila(2, "Media", 4.6)),
            inserción("CERVEZA", fila(3, "Alta", 6.0)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<grad>4.6>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["marca"]).toBe("Alta");
    });

    it("una selección con condición booleana retorna solo las tuplas con ese valor", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"), simple("activo"))),
            inserción("USUARIO", fila(1, "Ana", true)),
            inserción("USUARIO", fila(2, "Luis", false)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<activo=TRUE>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["nombre"]).toBe("Ana");
    });

    it("una selección con conjunción retorna solo las tuplas que satisfacen ambas condiciones", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("variedad"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Lager", 4.9)),
            inserción("CERVEZA", fila(2, "Stout", 5.5)),
            inserción("CERVEZA", fila(3, "Lager", 3.8)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<variedad='Lager' ∧ grad>4.0>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["grad"]).toBe(4.9);
    });

    it("una selección con disyunción retorna las tuplas que satisfacen al menos una condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("variedad"))),
            inserción("CERVEZA", fila(1, "Lager")),
            inserción("CERVEZA", fila(2, "Stout")),
            inserción("CERVEZA", fila(3, "IPA")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<variedad='Lager' ∨ variedad='Stout'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
    });

    it("una selección con atributo booleano directo retorna las tuplas donde es verdadero", () => {
        const modelo = modeloDesdeMR(`
            USUARIO < id(pk), nombre, activo >
            insertar en USUARIO <
                (1, 'Ana', veRDadero),
                (2, 'Luis', falso),
                (3, 'Pedro', TRUE),
                (4, 'Marta', true)
            >
        `);
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<activo>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(3);
        const nombres = resultado.tuplas.map(t => t["nombre"]);
        expect(nombres).toContain("Ana");
        expect(nombres).toContain("Pedro");
        expect(nombres).toContain("Marta");
        expect(nombres).not.toContain("Luis");
    });

    it("una selección con literal booleano directo retorna todas las tuplas que satisfacen la condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"))),
            inserción("USUARIO", fila(1, "Ana")),
            inserción("USUARIO", fila(2, "Luis")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<verdadero>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
    });
});
