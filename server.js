import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("./public/",import.meta.url));
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml"};
const port=Number(process.env.PORT||3000);

const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,"http://localhost").pathname;
  const requested=pathname==="/"?"/index.html":pathname;
  const safe=normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const file=join(root,safe);
  if(!file.startsWith(root)){res.writeHead(403);return res.end("Forbidden");}
  try{
    const data=await readFile(file);
    res.writeHead(200,{"content-type":types[extname(file)]||"application/octet-stream","x-content-type-options":"nosniff"});
    res.end(data);
  }catch{res.writeHead(404,{"content-type":"text/plain; charset=utf-8"});res.end("Not found");}
});
server.listen(port,()=>console.log(`Cron Visualizer em http://localhost:${port}`));
