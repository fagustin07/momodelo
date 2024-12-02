import "./style.css";
import {Entidad} from "./entidad.ts";
import {point} from "./posicion.ts";
import {init} from "./vista.ts";

init(document.body, [new Entidad("Mi Entidad", ["a", "b"], point(10, 10))]);
