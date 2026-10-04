const RANGES = [[0,59],[0,23],[1,31],[1,12],[0,6]];
const NAMES = [
  null,
  null,
  null,
  {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12},
  {SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6}
];

function number(value, field) {
  const map=NAMES[field];
  const key=String(value).toUpperCase();
  if (map && key in map) return map[key];
  if (!/^\d+$/.test(key)) throw new Error("valor inválido");
  return Number(key);
}

function segmentMatches(segment, value, field) {
  const [min,max]=RANGES[field];
  const [base, stepRaw]=segment.split("/");
  const step=stepRaw===undefined?1:Number(stepRaw);
  if (!Number.isInteger(step)||step<1) throw new Error("passo inválido");

  let start=min,end=max;
  if (base!=="*") {
    if (base.includes("-")) {
      const parts=base.split("-");
      if(parts.length!==2) throw new Error("intervalo inválido");
      start=number(parts[0],field); end=number(parts[1],field);
    } else {
      start=number(base,field);
      end=stepRaw===undefined?start:max;
    }
  }
  if(start<min||start>max||end<min||end>max||start>end) throw new Error("fora do intervalo");
  return value>=start && value<=end && (value-start)%step===0;
}

function fieldMatches(expr,value,field) {
  return expr.split(",").some(part=>segmentMatches(part.trim().toUpperCase(),value,field));
}

export function parseCron(expression) {
  const fields=String(expression).trim().split(/\s+/);
  if(fields.length!==5) throw new Error("Use exatamente 5 campos: minuto hora dia mês dia-da-semana.");
  fields.forEach((f,i)=>{
    if(!f) throw new Error("Campo vazio.");
    // Validate syntax and ranges by attempting all possible values.
    const [min,max]=RANGES[i];
    let valid=false;
    for(let v=min;v<=max;v++) if(fieldMatches(f,v,i)) valid=true;
    if(!valid) throw new Error("Campo inválido.");
  });
  return fields;
}

export function matchesCron(expression,date) {
  const f=parseCron(expression);
  return fieldMatches(f[0],date.getMinutes(),0)
    && fieldMatches(f[1],date.getHours(),1)
    && fieldMatches(f[2],date.getDate(),2)
    && fieldMatches(f[3],date.getMonth()+1,3)
    && fieldMatches(f[4],date.getDay(),4);
}

export function nextRuns(expression,count=8,from=new Date()) {
  parseCron(expression);
  const cursor=new Date(from);
  cursor.setSeconds(0,0);
  cursor.setMinutes(cursor.getMinutes()+1);
  const out=[];
  const limit=cursor.getTime()+366*24*60*60*1000;
  while(out.length<count && cursor.getTime()<=limit) {
    if(matchesCron(expression,cursor)) out.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes()+1);
  }
  if(out.length<count) throw new Error("Não foi possível calcular ocorrências no horizonte de 366 dias.");
  return out;
}

export function describeCron(expression) {
  const [min,hour,dom,month,dow]=parseCron(expression);
  const parts=[];
  if(min==="*"&&hour==="*") parts.push("a cada minuto");
  else if(min.startsWith("*/")&&hour==="*") parts.push("a cada "+min.slice(2)+" minutos");
  else if(/^\d+$/.test(min)&&/^\d+$/.test(hour)) parts.push(`às ${hour.padStart(2,"0")}:${min.padStart(2,"0")}`);
  else parts.push(`quando minuto “${min}” e hora “${hour}” coincidirem`);
  if(dom!=="*") parts.push(`nos dias ${dom} do mês`);
  if(month!=="*") parts.push(`nos meses ${month}`);
  if(dow!=="*") parts.push(`nos dias da semana ${dow}`);
  return parts.join(", ")+".";
}
