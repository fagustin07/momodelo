import "./style.css";
import {Entidad} from "./entidad.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";

init(document.body, [new Entidad("Mi Entidad", ["a", "b"], coordenada(10, 10))]);

