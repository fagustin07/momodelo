import {PALABRAS_RESERVADAS_AR, PATRON_CADENA, PATRON_NOMBRE, PATRON_NUMERO, TokenAR} from "../tipos/tipos.ts";

export class TokenizadorAR {
    ejecutarseCon(texto: string): TokenAR[] {
        const tokens: TokenAR[] = [];
        let pos = 0;

        while (pos < texto.length) {
            if (/\s/.test(texto[pos])) {
                pos++;
                continue;
            }

            if (texto[pos] === "σ") { tokens.push({tipo: "SIGMA",        valor: "σ", posicion: pos}); pos++; continue; }
            if (texto[pos] === "π") { tokens.push({tipo: "PI",           valor: "π", posicion: pos}); pos++; continue; }
            if (texto[pos] === "ρ") { tokens.push({tipo: "RHO",          valor: "ρ", posicion: pos}); pos++; continue; }
            if (texto[pos] === "←") { tokens.push({tipo: "FLECHA",       valor: "←", posicion: pos}); pos++; continue; }
            if (texto[pos] === "∧") { tokens.push({tipo: "AND",          valor: "∧", posicion: pos}); pos++; continue; }
            if (texto[pos] === "∨") { tokens.push({tipo: "OR",           valor: "∨", posicion: pos}); pos++; continue; }
            if (texto[pos] === "∪") { tokens.push({tipo: "UNION",        valor: "∪", posicion: pos}); pos++; continue; }
            if (texto[pos] === "∩") { tokens.push({tipo: "INTERSECTION", valor: "∩", posicion: pos}); pos++; continue; }
            if (texto[pos] === "÷") { tokens.push({tipo: "DIVISION",    valor: "÷", posicion: pos}); pos++; continue; }

            const dosCaracteres = texto.slice(pos, pos + 2);
            if (dosCaracteres === "<=" || dosCaracteres === ">=" || dosCaracteres === "!=") {
                tokens.push({tipo: "OP_COMP", valor: dosCaracteres, posicion: pos});
                pos += 2;
                continue;
            }

            if (texto[pos] === "=") { tokens.push({tipo: "OP_COMP",   valor: "=",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "-") { tokens.push({tipo: "DIFFERENCE", valor: "-",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "<") { tokens.push({tipo: "LANGLE",    valor: "<",  posicion: pos}); pos++; continue; }
            if (texto[pos] === ">") { tokens.push({tipo: "RANGLE",    valor: ">",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "×") { tokens.push({tipo: "PRODUCT",    valor: "×",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "⋈") { tokens.push({tipo: "BOWTIE",     valor: "⋈",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "*") { tokens.push({tipo: "STAR",       valor: "*",  posicion: pos}); pos++; continue; }
            if (texto[pos] === "(") { tokens.push({tipo: "LPAREN",    valor: "(",  posicion: pos}); pos++; continue; }
            if (texto[pos] === ")") { tokens.push({tipo: "RPAREN",    valor: ")",  posicion: pos}); pos++; continue; }
            if (texto[pos] === ",") { tokens.push({tipo: "COMA",      valor: ",",  posicion: pos}); pos++; continue; }

            const cadena = PATRON_CADENA.exec(texto.slice(pos));
            if (cadena) {
                tokens.push({tipo: "CADENA", valor: cadena[1], posicion: pos});
                pos += cadena[0].length;
                continue;
            }

            const numero = PATRON_NUMERO.exec(texto.slice(pos));
            if (numero) {
                tokens.push({tipo: "NUMERO", valor: numero[0], posicion: pos});
                pos += numero[0].length;
                continue;
            }

            const nombre = PATRON_NOMBRE.exec(texto.slice(pos));
            if (nombre) {
                const lexema = nombre[0];
                const reservada = PALABRAS_RESERVADAS_AR[lexema.toUpperCase()];
                tokens.push({tipo: reservada ?? "NOMBRE", valor: lexema, posicion: pos});
                pos += lexema.length;
                continue;
            }

            tokens.push({tipo: "DESCONOCIDO", valor: texto[pos], posicion: pos});
            pos++;
        }

        tokens.push({tipo: "EOF", valor: "", posicion: pos});
        return tokens;
    }
}
