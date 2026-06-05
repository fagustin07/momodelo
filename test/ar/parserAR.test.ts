import {describe, it} from "vitest";
import {esperarAnálisisSintácticoAR, esperarErrorSintácticoAR} from "./helpers.ts";

describe("[Álgebra Relacional] Parser AR", () => {
    it("un nombre de relación solo se parsea como NombreDeRelación con ese nombre", () => {
        esperarAnálisisSintácticoAR("PERSONA", {nombre: "PERSONA"});
    });

    it("los espacios alrededor del nombre no afectan el resultado", () => {
        esperarAnálisisSintácticoAR("  CLIENTE  ", {nombre: "CLIENTE"});
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
        esperarAnálisisSintácticoAR("σ<marca='Quilmes'>Cerveza", {
            condición: {
                izq: {nombre: "marca"},
                op: "=",
                der: {valor: "Quilmes"},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación numérica mayor-que es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<grad>4.6>Cerveza", {
            condición: {
                izq: {nombre: "grad"},
                op: ">",
                der: {valor: 4.6},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación de atributo contra atributo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<precioMin<precioMax>Producto", {
            condición: {
                izq: {nombre: "precioMin"},
                op: "<",
                der: {nombre: "precioMax"},
            },
            subexpr: {nombre: "Producto"},
        });
    });

    it("una selección con comparación booleana es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo=TRUE>Usuario", {
            condición: {
                izq: {nombre: "activo"},
                op: "=",
                der: {valor: true},
            },
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con atributo booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo>Usuario", {
            condición: {operando: {nombre: "activo"}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con literal booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<TRUE>Usuario", {
            condición: {operando: {valor: true}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con condición compuesta por intersección es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∧ grad>4.6>Cerveza", {
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
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∨ variedad='Stout'>Cerveza", {
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
        esperarAnálisisSintácticoAR("σ<grad>4.6>σ<variedad='Lager'>Cerveza", {
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
        esperarAnálisisSintácticoAR("σ<(edad>23)>CLIENTE", {
            condición: {
                izq: {nombre: "edad"},
                op: ">",
                der: {valor: 23},
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("se pueden reconocer conjunciones en una condición de selección", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∧ b=2)>CLIENTE", {
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
            "σ<edad>23 ∧ (ciudad='Buenos Aires' ∨ edad>50) ∧ apellido='Sanchez'>CLIENTE",
            {
                condición: {
                    izq: {
                        izq: {izq: {nombre: "edad"}, op: ">", der: {valor: 23}},
                        der: {
                            izq: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "Buenos Aires"}},
                            der: {izq: {nombre: "edad"}, op: ">", der: {valor: 50}},
                        },
                    },
                    der: {izq: {nombre: "apellido"}, op: "=", der: {valor: "Sanchez"}},
                },
                subexpr: {nombre: "CLIENTE"},
            },
        );
    });

    it("se pueden generar condiciones complejas", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∨ b=2) ∧ (c=3 ∨ d=4)>CLIENTE", {
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
});
