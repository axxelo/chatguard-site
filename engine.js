// ChatGuard extraction engine (server module).
// Pure functions — same logic as the in-browser demo, no DOM dependency.

function parseT(t){if(!t)return null;const p=String(t).split(":").map(Number);return p[0]*3600+p[1]*60+(p[2]||0);}
function fmtDur(s){if(s==null||s<0)return null;return s;} // seconds (numeric) for API consumers
function normSize(sz){if(!sz)return 0;const m=sz.match(/(\d+(?:\.\d+)?)\s?(k|m|mm|bn|yards?|mio|mln)?/i);if(!m)return 0;let n=parseFloat(m[1]);const u=(m[2]||"m").toLowerCase();if(u==="k")n*=0.001;else if(u==="bn"||u.startsWith("yard"))n*=1000;return n;}

function extract(text){
  const lines=String(text||"").split(/\r?\n/);
  const SIZE=/\b(\d+(?:\.\d+)?)\s?(k|m|mm|bn|yards?|mio|mln)\b/i;
  const FXPAIR=/\b([A-Z]{3}\/[A-Z]{3})\b/;
  const FXCONCAT=/\b(EUR|GBP|AUD|NZD|USD)(USD|JPY|CHF|CAD|GBP)\b/;
  const TENOR=/\b(\d{1,2}\s?(?:y|yr|yrs|year|mo|mth))\b/i;
  const TWO_SIDED=/(\d+(?:\.\d+)?)\s?[\/\-]\s?(\d+(?:\.\d+)?)/;
  const AT_PRICE=/(?:@|at)\s?(\d+(?:\.\d{2,6}))/i;
  const TICKER=/\$([A-Z]{1,5})\b/;
  const EQ=["AAPL","MSFT","TSLA","AMZN","GOOGL","META","NVDA","SPX","ESTX","FTSE","DAX","NKY"];
  const ASSET=[
    {cls:"FX",re:/[A-Z]{3}\/[A-Z]{3}|EURUSD|GBPUSD|USDJPY|AUDUSD|USDCHF|USDCAD/},
    {cls:"Metals",re:/\b(gold|xau|silver|xag|platinum|xpt)\b/i},
    {cls:"Energy",re:/\b(brent|wti|crude|nat\s?gas|natgas)\b/i},
    {cls:"Rates",re:/\b(\d{1,2}\s?(?:y|yr|yrs|year))\b|\bswap\b|\bbond\b|\bgilt\b|\btreasury\b|\bbund\b|\bjgb\b/i},
    {cls:"Equities",re:/\$[A-Z]{1,5}\b|\b(AAPL|MSFT|TSLA|AMZN|GOOGL|META|NVDA|SPX|FTSE|DAX)\b/}
  ];
  const KW={
    rfq:["looking for","where are you","where r u","where you","px on","price on","level on","can you make","make me","show me","rfq","quote on","mid on","axe","your axe","interest in","what's your","whats your","where do you","where's","can i get","need a price","where can you pay","where can you","show me a"],
    quote:["i make","i show","choice","i'm a","im a","quote is","showing","bid for","offer at","offered at"],
    fill:["done","fill","filled","mine","yours","i buy","i sell","you buy","you sell","agreed","done at","i'll take","ill take","i take","ur done","you're done","sold","bought","lift","lifted","hit the","trade done"]
  };
  const FOLLOW=["will confirm","confirm by","revert","get back","follow up","follow-up","send confirm","check and","let me check","come back to you","i'll send","ill send","send you the","by eod","by end of day","tomorrow","later today","chase","ttyl","await","awaiting","pending"];
  const BUY=["i buy","you sell","mine","lift","lifted","i'll take","ill take","i take","bought"];
  const SELL=["i sell","you buy","yours","sold","give you","offer you","sell you"];
  const FLAGS=[
    {sev:"high",typology:"Market abuse",terms:["wash trade","manipulate","ramp the","front run","front-run","spoof","layering","fix the rate","rig the","inside info","insider","material non-public","non public","mnpi","guarantee you","guaranteed return"]},
    {sev:"high",typology:"Information barrier",terms:["off the record","between us","keep this quiet","keep it quiet","don't tell","dont tell","delete this","delete the","collude"]},
    {sev:"medium",typology:"Off-channel comms",terms:["whatsapp","signal app","telegram","personal email","gmail","my cell","my mobile","call my","take it offline","off channel","off-channel"]},
    {sev:"medium",typology:"Inducement",terms:["gift","tickets","entertainment","backhander","cash payment","under the table"]},
    {sev:"low",typology:"Conduct",terms:["idiot","stupid","screwed","pissed","wtf","shut up","hate this","useless"]}
  ];
  const POS=["thanks","thank you","great","appreciate","good","nice","perfect","cheers","helpful","welcome","pleasure","excellent","love it","well done","quick turn"];
  const NEG=["unhappy","angry","wrong","late","problem","issue","unacceptable","disappointed","slow","missed","complaint","frustrat","poor","terrible","worse","worst","annoyed","not good","never again","fed up","nothing there"];
  const P1=/^(\d{1,2}:\d{2}(?::\d{2})?)\s+([A-Za-z0-9_.\-]{1,14})\s*[:\-\u2013]?\s+(.*)$/;
  const P2=/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*<?([A-Za-z0-9_.\-]{1,14})>?\s*[:\-]?\s*(.*)$/;
  const P3=/^([A-Za-z0-9_.\-]{1,14})\s*[:\-\u2013]\s+(.*)$/;
  const msgs=[];let last=null;
  for(const raw of lines){const ln=raw.trim();if(!ln)continue;let m,time="",sender="",body="";
    if((m=ln.match(P2))){time=m[1];sender=m[2];body=m[3];}
    else if((m=ln.match(P1))){time=m[1];sender=m[2];body=m[3];}
    else if((m=ln.match(P3))){sender=m[1];body=m[2];}
    else{if(last){last.body+=" "+ln;continue;}else{body=ln;sender="?";}}
    last={time,sender,body};msgs.push(last);}
  const has=(s,arr)=>arr.find(k=>s.includes(k));
  const events=[],followups=[],flagsOut=[];const cps={},byUser={},notional={};
  let rfq=0,quote=0,fill=0;const deals=[];const open=[];let did=1;
  for(const x of msgs){
    const low=x.body.toLowerCase();const ts=parseT(x.time);
    byUser[x.sender]=byUser[x.sender]||{msgs:0,flags:0,sent:0};byUser[x.sender].msgs++;
    let inst=(x.body.match(FXPAIR)||x.body.match(FXCONCAT)||x.body.match(TICKER)||x.body.match(TENOR)||[])[0]||"";
    if(!inst){const e=EQ.find(t=>new RegExp("\\b"+t+"\\b").test(x.body));if(e)inst=e;}
    let assetClass="";for(const a of ASSET){if(a.re.test(x.body)){assetClass=a.cls;break;}}
    const sz=(x.body.match(SIZE)||[])[0]||"";const notM=normSize(sz);
    const two=x.body.match(TWO_SIDED);const at=x.body.match(AT_PRICE);
    const price=two?(two[1]+"/"+two[2]):(at?at[1]:"");
    let side=has(low,BUY)?"BUY":(has(low,SELL)?"SELL":"");
    let cp="";const cpm=x.body.match(/(?:cp|counterparty|vs\.?|with|client|for)\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+){0,2})/);
    if(cpm)cp=cpm[1].trim();
    const isFill=!!has(low,KW.fill);
    const isQuote=!!(two||(has(low,KW.quote)&&inst));
    const isRFQ=!!(has(low,KW.rfq)||(sz&&inst&&/where|px|price|level|make|quote|looking|need|pay/.test(low)));
    let type=isFill?"FILL":(isQuote?"QUOTE":(isRFQ?"RFQ":""));
    if(type)events.push({time:x.time,ts,sender:x.sender,type,inst,assetClass,size:sz,notM,side,price,cp,body:x.body});
    if(type==="RFQ"){rfq++;const d={id:"D"+(did++),inst,assetClass,size:sz,notM,side,cp,rfqTime:x.time,rfqTs:ts,rfqBy:x.sender,status:"requested",quoteTs:null,quotePrice:"",fillTs:null,fillPrice:"",t2q:null,t2f:null};deals.push(d);open.push(d);}
    else if(type==="QUOTE"){quote++;const d=[...open].reverse().find(o=>(!inst||!o.inst||o.inst===inst)&&o.status==="requested")||[...open].reverse().find(o=>o.status==="requested");if(d){d.status="quoted";d.quoteTs=ts;d.quotePrice=price;if(d.rfqTs!=null&&ts!=null)d.t2q=ts-d.rfqTs;}}
    else if(type==="FILL"){fill++;const d=[...open].reverse().find(o=>(!inst||!o.inst||o.inst===inst)&&o.status!=="filled")||[...open].reverse().find(o=>o.status!=="filled");if(d){d.status="filled";d.fillTs=ts;d.fillPrice=price||d.quotePrice;if(d.rfqTs!=null&&ts!=null)d.t2f=ts-d.rfqTs;if(side&&!d.side)d.side=side;const i=open.indexOf(d);if(i>=0)open.splice(i,1);}}
    if(cp){cps[cp]=cps[cp]||{mentions:0,sent:0};cps[cp].mentions++;}
    if(type==="RFQ"&&inst&&notM){notional[assetClass||inst]=(notional[assetClass||inst]||0)+notM;}
    if(has(low,FOLLOW))followups.push({time:x.time,sender:x.sender,body:x.body});
    let s=0;POS.forEach(w=>{if(low.includes(w))s++;});NEG.forEach(w=>{if(low.includes(w))s--;});
    byUser[x.sender].sent+=s;if(cp)cps[cp].sent+=s;
    for(const grp of FLAGS){const hit=has(low,grp.terms);if(hit){flagsOut.push({time:x.time,sender:x.sender,sev:grp.sev,typology:grp.typology,term:hit,body:x.body});byUser[x.sender].flags++;}}
  }
  // counterparty resolution: group aliases (strip legal/entity suffixes)
  const cpKey=n=>n.toLowerCase().replace(/\b(capital|cap|partners|llp|ltd|limited|inc|incorporated|bank|securities|group|holdings|asset management|am|llc|plc|sa|sas)\b/g,"").replace(/[^a-z0-9]/g,"");
  const resolved={};
  for(const [name,v] of Object.entries(cps)){
    const k=cpKey(name)||name.toLowerCase();
    if(!resolved[k]){resolved[k]={name,mentions:0,sent:0,aliases:new Set()};}
    const r=resolved[k];r.mentions+=v.mentions;r.sent+=v.sent;r.aliases.add(name);
    if(name.length>r.name.length)r.name=name; // prefer the most complete alias
  }
  const counterparties=Object.values(resolved).map(r=>({name:r.name,mentions:r.mentions,sent:r.sent,aliases:[...r.aliases]})).sort((a,b)=>b.mentions-a.mentions);
  // typology rollup
  const typologies={};for(const f of flagsOut){typologies[f.typology]=(typologies[f.typology]||0)+1;}
  const filled=deals.filter(d=>d.status==="filled");
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):null;
  const t2qs=deals.filter(d=>d.t2q!=null).map(d=>d.t2q);
  const t2fs=filled.filter(d=>d.t2f!=null).map(d=>d.t2f);
  return{stats:{messages:msgs.length,deals:deals.length,rfq,quote,fill,filled:filled.length,
      hit:deals.length?Math.round(100*filled.length/deals.length):0,
      followups:followups.length,flags:flagsOut.length,users:Object.keys(byUser).length,highFlags:flagsOut.filter(f=>f.sev==="high").length,
      avgSecsToQuote:avg(t2qs),avgSecsToFill:avg(t2fs),notionalM:Math.round(Object.values(notional).reduce((a,b)=>a+b,0))},
    deals,events,followups,flags:flagsOut,notional,
    counterparties,typologies,
    byUser:Object.entries(byUser).map(([n,v])=>({user:n,...v})).sort((a,b)=>b.msgs-a.msgs)};
}

module.exports={extract,normSize,parseT};
