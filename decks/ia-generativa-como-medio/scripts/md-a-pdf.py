#!/usr/bin/env python3
"""Pasa la guia de estudio a HTML legible para imprimir o subir como PDF."""
import io, pathlib, subprocess, sys
R = pathlib.Path(__file__).resolve().parent.parent
src = R/"build"/"guia-de-estudio.md"
html = subprocess.run(["node","-e",
    "const{marked}=require('marked');const fs=require('fs');"
    "process.stdout.write(marked.parse(fs.readFileSync(process.argv[1],'utf8'),{gfm:true}))",
    str(src)], capture_output=True, text=True, check=True).stdout
CSS = """
:root{--ink:#16150F;--mut:#6E6A5E;--ln:#D6D0C1;--ac:#2B3FD9;--pap:#FBFAF6}
*{box-sizing:border-box}
body{margin:0;background:var(--pap);color:var(--ink);
 font:15px/1.62 "Iowan Old Style",Palatino,Georgia,serif;}
.wrap{max-width:820px;margin:0 auto;padding:54px 40px 90px}
h1{font-family:Inter,system-ui,sans-serif;font-size:34px;line-height:1.12;margin:0 0 4px;letter-spacing:-.015em}
h2{font-family:Inter,system-ui,sans-serif;font-size:15px;letter-spacing:.14em;text-transform:uppercase;
 color:var(--ac);margin:52px 0 16px;padding-bottom:9px;border-bottom:1px solid var(--ln)}
h3{font-family:Inter,system-ui,sans-serif;font-size:19px;margin:38px 0 10px}
h4{font-family:Inter,system-ui,sans-serif;font-size:16.5px;margin:30px 0 12px;padding-top:14px;
 border-top:2px solid var(--ink);break-after:avoid}
p{margin:0 0 12px}
blockquote{margin:10px 0 16px;padding:2px 0 2px 16px;border-left:3px solid var(--ac);color:#3C3B2E}
blockquote p{margin:0}
strong{font-weight:700}
em{color:var(--mut)}
table{width:100%;border-collapse:collapse;margin:14px 0 20px;font-size:13.5px;
 font-family:Inter,system-ui,sans-serif}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--ln);vertical-align:top}
th{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
ol,ul{margin:0 0 14px;padding-left:24px}
li{margin:3px 0}
hr{border:0;border-top:1px solid var(--ln);margin:40px 0}
code{font-family:Menlo,monospace;font-size:12.5px;background:#F0EDE4;padding:1px 5px;border-radius:3px}
@page{size:A4;margin:18mm 16mm}
@media print{body{background:#fff}.wrap{max-width:none;padding:0}
 h2,h3,h4{break-after:avoid}blockquote,table{break-inside:avoid}}
"""
out = R/"build"/"guia-de-estudio.html"
out.write_text(f'<!doctype html><html lang="es"><head><meta charset="utf-8">'
  f'<title>Guía de estudio · La IA generativa como medio</title><style>{CSS}</style></head>'
  f'<body><div class="wrap">{html}</div></body></html>', encoding="utf-8")
print("escrito:", out)
