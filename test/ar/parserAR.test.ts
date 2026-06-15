import {describe, it} from "vitest";
import {esperarAnálisisSintácticoAR, esperarErrorSintácticoAR} from "./helpers.ts";
import {ExpresiónProyección, ExpresiónSelección, NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {Intersección, Resta, Unión} from "../../src/ar/modeloSintactico/operadorDeConjuntos.ts";

describe("[Álgebra Relacional] Parser AR", () => {
    it("un nombre de relación solo se parsea como NombreDeRelación con ese nombre", () => {
        esperarAnálisisSintácticoAR("PERSONA", NombreDeRelación, {nombre: "PERSONA"});
    });

    it("los espacios alrededor del nombre no afectan el resultado", () => {
        esperarAnálisisSintácticoAR("  CLIENTE  ", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("una consulta vacía lanza una excepción", () => {
        esperarErrorSintácticoAR("", "La consulta está vacía.");
    });

    it("se levanta una excepción cuando hay dos nombres sin operadores", () => {
        esperarErrorSintácticoAR(
            "PERSONA PEDIDO",
            "Se esperaba fin de consulta pero se encontró 'PEDIDO'.",
        );
    });

    it("un carácter desconocido levanta una excepción", () => {
        esperarErrorSintácticoAR("@", "Se esperaba una expresión pero se encontró '@'.");
    });

    it("una selección con comparación de igualdad es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<marca='Quilmes'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "marca"},
                op: "=",
                der: {valor: "Quilmes"},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación numérica mayor-que es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<grad>4.6>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "grad"},
                op: ">",
                der: {valor: 4.6},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación de atributo contra atributo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<precioMin<precioMax>Producto", ExpresiónSelección, {
            condición: {
                izq: {nombre: "precioMin"},
                op: "<",
                der: {nombre: "precioMax"},
            },
            subexpr: {nombre: "Producto"},
        });
    });

    it("una selección con comparación booleana es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo=TRUE>Usuario", ExpresiónSelección, {
            condición: {
                izq: {nombre: "activo"},
                op: "=",
                der: {valor: true},
            },
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con atributo booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo>Usuario", ExpresiónSelección, {
            condición: {operando: {nombre: "activo"}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con literal booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<TRUE>Usuario", ExpresiónSelección, {
            condición: {operando: {valor: true}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con condición compuesta por intersección es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∧ grad>4.6>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                der: {
                    izq: {nombre: "grad"},
                    op: ">",
                    der: {valor: 4.6},
                },
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con condición compuesta por disyunción es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∨ variedad='Stout'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                der: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Stout"},
                },
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("se pueden anidar selecciones", () => {
        esperarAnálisisSintácticoAR("σ<grad>4.6>σ<variedad='Lager'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "grad"},
                op: ">",
                der: {valor: 4.6},
            },
            subexpr: {
                condición: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                subexpr: {nombre: "Cerveza"},
            },
        });
    });

    it("una selección sin condición informa que no tiene la estructura correcta", () => {
        esperarErrorSintácticoAR("σ<>Cerveza", "σ: se esperaba '<condición>expresión'.");
    });

    it("una selección sin cierre de condición levanta una excepción que no tiene la estructura correcta", () => {
        esperarErrorSintácticoAR(
            "σ<marca='Quilmes'Cerveza",
            "σ: se esperaba '<condición>expresión'.",
        );
    });

    it("la condición de una selección puede escribirse entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<(edad>23)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {nombre: "edad"},
                op: ">",
                der: {valor: 23},
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("se pueden reconocer conjunciones en una condición de selección", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∧ b=2)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {izq: {nombre: "a"}, op: "=", der: {valor: 1}},
                der: {izq: {nombre: "b"}, op: "=", der: {valor: 2}},
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("una condición con paréntesis al inicio y disyunciones subsiguientes asocia a izquierda", () => {
        esperarAnálisisSintácticoAR(
            "σ<(edad>23 ∧ ciudad='Buenos Aires') ∨ edad>50 ∨ apellido='Sanchez'>CLIENTE",
            ExpresiónSelección,
            {
                condición: {
                    izq: {
                        izq: {
                            izq: {izq: {nombre: "edad"}, op: ">", der: {valor: 23}},
                            der: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "Buenos Aires"}},
                        },
                        der: {izq: {nombre: "edad"}, op: ">", der: {valor: 50}},
                    },
                    der: {izq: {nombre: "apellido"}, op: "=", der: {valor: "Sanchez"}},
                },
                subexpr: {nombre: "CLIENTE"},
            },
        );
    });

    it("se puede combinar una disyunción entre conjunciones con paréntesis", () => {
        esperarAnálisisSintácticoAR(
            "σ<edad>23 ∧ (ciudad='Buenos Aires' ∨ edad>50) ∧ apellido='Sánchez'>CLIENTE",
            ExpresiónSelección,
            {
                condición: {
                    izq: {
                        izq: {izq: {nombre: "edad"}, op: ">", der: {valor: 23}},
                        der: {
                            izq: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "Buenos Aires"}},
                            der: {izq: {nombre: "edad"}, op: ">", der: {valor: 50}},
                        },
                    },
                    der: {izq: {nombre: "apellido"}, op: "=", der: {valor: "Sánchez"}},
                },
                subexpr: {nombre: "CLIENTE"},
            },
        );
    });

    it("se pueden generar condiciones complejas", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∨ b=2) ∧ (c=3 ∨ d=4)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {izq: {nombre: "a"}, op: "=", der: {valor: 1}},
                    der: {izq: {nombre: "b"}, op: "=", der: {valor: 2}},
                },
                der: {
                    izq: {izq: {nombre: "c"}, op: "=", der: {valor: 3}},
                    der: {izq: {nombre: "d"}, op: "=", der: {valor: 4}},
                },
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("se puede reconocer una proyección", () => {
        esperarAnálisisSintácticoAR("π<nombre>PERSONA", ExpresiónProyección, {
            atributos: ["nombre"],
            subexpr: {nombre: "PERSONA"},
        });
    });

    it("se puede reconocer una proyección con múltiples atributos", () => {
        esperarAnálisisSintácticoAR("π<nombre,edad,ciudad>PERSONA", ExpresiónProyección, {
            atributos: ["nombre", "edad", "ciudad"],
            subexpr: {nombre: "PERSONA"},
        });
    });

    it("se reconocen selecciones y proyecciones combinadas en una consulta", () => {
        esperarAnálisisSintácticoAR("π<nombre>σ<edad>30>PERSONA", ExpresiónProyección, {
            atributos: ["nombre"],
            subexpr: {
                condición: {izq: {nombre: "edad"}, op: ">", der: {valor: 30}},
                subexpr: {nombre: "PERSONA"},
            },
        });
    });

    it("una proyección malformada levanta una excepción", () => {
        esperarErrorSintácticoAR("π<PERSONA", "π: se esperaba '<listaDeAtributos>expresión'.");
    });

    it("una proyección sin cierre levanta una excepción", () => {
        esperarErrorSintácticoAR("π<nombre PERSONA", "π: se esperaba '<listaDeAtributos>expresión'.");
    });

    it("una expresión entre paréntesis parsea correctamente", () => {
        esperarAnálisisSintácticoAR("(CLIENTE)", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("se reconocen expresiones entre paréntesis", () => {
        esperarAnálisisSintácticoAR("( CLIENTE )", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("se reconoce una selección aplicada a una expresión entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<edad>30>(CLIENTE)", ExpresiónSelección, {
            condición: {izq: {nombre: "edad"}, op: ">", der: {valor: 30}},
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("una unión de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("NARUTO ∪ SASUKE", Unión, {
            izq: {nombre: "NARUTO"},
            der: {nombre: "SASUKE"},
        });
    });

    it("una intersección de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("GOKU ∩ VEGETA", Intersección, {
            izq: {nombre: "GOKU"},
            der: {nombre: "VEGETA"},
        });
    });

    it("una resta de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("LUFFY - ZORO", Resta, {
            izq: {nombre: "LUFFY"},
            der: {nombre: "ZORO"},
        });
    });

    it("las operaciones de conjunto encadenan hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("ICHIGO ∪ RUKIA ∩ RENJI", Intersección, {
            izq: {izq: {nombre: "ICHIGO"}, der: {nombre: "RUKIA"}},
            der: {nombre: "RENJI"},
        });
    });

    it("una selección compuesta con unión es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<chakra>100>NARUTO ∪ σ<chakra>100>SASUKE", Unión, {
            izq: {
                condición: {izq: {nombre: "chakra"}, op: ">", der: {valor: 100}},
                subexpr: {nombre: "NARUTO"},
            },
            der: {
                condición: {izq: {nombre: "chakra"}, op: ">", der: {valor: 100}},
                subexpr: {nombre: "SASUKE"},
            },
        });
    });

    it("los paréntesis agrupan operaciones de conjunto", () => {
        esperarAnálisisSintácticoAR("GOKU ∪ (VEGETA ∩ GOHAN)", Unión, {
            izq: {nombre: "GOKU"},
            der: {izq: {nombre: "VEGETA"}, der: {nombre: "GOHAN"}},
        });
    });

    it("la selección tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("σ<ki>9000>GOKU ∪ VEGETA", Unión, {
            izq: {
                condición: {izq: {nombre: "ki"}, op: ">", der: {valor: 9000}},
                subexpr: {nombre: "GOKU"},
            },
            der: {nombre: "VEGETA"},
        });
    });

    it("la proyección tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("π<aldea>NARUTO ∩ SASUKE", Intersección, {
            izq: {
                atributos: ["aldea"],
                subexpr: {nombre: "NARUTO"},
            },
            der: {nombre: "SASUKE"},
        });
    });

    it("los operadores unarios tienen precedencia sobre la resta", () => {
        esperarAnálisisSintácticoAR("σ<recompensa>1000000>LUFFY - π<recompensa>ZORO", Resta, {
            izq: {
                condición: {izq: {nombre: "recompensa"}, op: ">", der: {valor: 1000000}},
                subexpr: {nombre: "LUFFY"},
            },
            der: {
                atributos: ["recompensa"],
                subexpr: {nombre: "ZORO"},
            },
        });
    });

    it("tres operaciones de conjunto se asocian hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("GOKU ∪ VEGETA ∩ GOHAN - PICCOLO", Resta, {
            izq: {
                izq: {izq: {nombre: "GOKU"}, der: {nombre: "VEGETA"}},
                der: {nombre: "GOHAN"},
            },
            der: {nombre: "PICCOLO"},
        });
    });

    it("una selección con conjunción y una proyección anidada se combinan con unión", () => {
        esperarAnálisisSintácticoAR("σ<ki>8000 ∧ chakra>500>NARUTO ∪ π<rango>σ<ninjutsu>100>SASUKE", Unión, {
            izq: {
                condición: {
                    izq: {izq: {nombre: "ki"}, op: ">", der: {valor: 8000}},
                    der: {izq: {nombre: "chakra"}, op: ">", der: {valor: 500}},
                },
                subexpr: {nombre: "NARUTO"},
            },
            der: {
                atributos: ["rango"],
                subexpr: {
                    condición: {izq: {nombre: "ninjutsu"}, op: ">", der: {valor: 100}},
                    subexpr: {nombre: "SASUKE"},
                },
            },
        });
    });

    it("una combinación compleja de proyecciones, uniones e intersecciones respeta paréntesis y precedencia", () => {
        esperarAnálisisSintácticoAR("π<fruta>LUFFY ∪ π<espada>ZORO ∩ (π<clima>NAMI ∪ π<medicina>σ<recompensa='300'>CHOPPER)", Intersección, {
            izq: {
                izq: {
                    atributos: ["fruta"],
                    subexpr: {nombre: "LUFFY"},
                },
                der: {
                    atributos: ["espada"],
                    subexpr: {nombre: "ZORO"},
                },
            },
            der: {
                izq: {
                    atributos: ["clima"],
                    subexpr: {nombre: "NAMI"},
                },
                der: {
                    atributos: ["medicina"],
                    subexpr: {
                        condición: {izq: {nombre: "recompensa"}, op: "=", der: {valor: "300"}},
                        subexpr: {nombre: "CHOPPER"},
                    },
                },
            },
        });
    });

    it("una selección puede aplicarse a una unión agrupada entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<ki>9000>(GOKU ∪ VEGETA)", ExpresiónSelección, {
            condición: {izq: {nombre: "ki"}, op: ">", der: {valor: 9000}},
            subexpr: {
                izq: {nombre: "GOKU"},
                der: {nombre: "VEGETA"},
            },
        });
    });

    it("una proyección puede aplicarse a una intersección agrupada entre paréntesis", () => {
        esperarAnálisisSintácticoAR("π<aldea>(NARUTO ∩ SASUKE)", ExpresiónProyección, {
            atributos: ["aldea"],
            subexpr: {
                izq: {nombre: "NARUTO"},
                der: {nombre: "SASUKE"},
            },
        });
    });
});