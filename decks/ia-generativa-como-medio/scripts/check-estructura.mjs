// Coteja las cards contra la tabla de reparto de tiempo del mapa de contenido.
import fs from "node:fs"; import { parse } from "yaml";
const ESPERADO = [
  ["Apertura", 1, "0:20"],
  ["El tema: de herramienta a medio y ambiente", 4, "1:20"],
  ["La pregunta y dónde se busca", 4, "1:20"],
  ["Qué está pasando ya", 2, "0:40"],
  ["Lo que realmente ocurre en la práctica", 2, "0:40"],
  ["Lo que se juega: autoría, criterio, riesgo", 3, "1:00"],
  ["El vacío y el aporte", 3, "1:00"],
  ["Cierre", 1, "0:20"],
];
const secs = fs.readdirSync("cards").filter(f=>/\.ya?ml$/.test(f)&&f!=="deck.yaml").sort()
  .map(f=>parse(fs.readFileSync(`cards/${f}`,"utf8")));
let fallas = 0;
console.log("bloque".padEnd(46), "decl", "real", "tiempo", "");
secs.forEach((s,i)=>{
  const [ , lamEsp, tEsp] = ESPERADO[i] ?? ["?",0,"?"];
  const real = s.cards.length, decl = s.section.laminas, t = s.section.tiempo;
  const ok = real===lamEsp && decl===lamEsp && t===tEsp;
  if(!ok) fallas++;
  console.log(String(s.section.title).slice(0,46).padEnd(46), String(decl).padEnd(4), String(real).padEnd(4), t.padEnd(6), ok?"ok":"NO COINCIDE");
});
const total = secs.reduce((a,s)=>a+s.cards.length,0);
const seg = total*20;
console.log(`\ntotal: ${total} láminas = ${Math.floor(seg/60)}:${String(seg%60).padStart(2,"0")}`);
console.log(total===20 && seg===400 ? "coincide con la tabla" : "NO coincide");
// ids correlativos 01..20
const ids = secs.flatMap(s=>s.cards.map(c=>c.id));
const esperados = Array.from({length:20},(_,i)=>String(i+1).padStart(2,"0"));
console.log("ids 01..20 en orden:", JSON.stringify(ids)===JSON.stringify(esperados) ? "sí" : "NO · "+ids.join(","));
process.exit(fallas?1:0);
