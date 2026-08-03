// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const S = {
  bg:'#0c0c0e', s1:'#111114', s2:'#17171b', bd:'#232329', bd2:'#2e2e38',
  red:'#ff4d4d', redDim:'#7a1a1a', redBg:'rgba(255,77,77,.07)',
  amber:'#f5a623', amberBg:'rgba(245,166,35,.07)',
  green:'#2ecc71', greenBg:'rgba(46,204,113,.07)',
  blue:'#4d9fff', blueBg:'rgba(77,159,255,.07)',
  tx:'#e8e8ed', tx2:'#9999aa', tx3:'#55555f',
  font:"'IBM Plex Mono', monospace",
  title:"'Anton', sans-serif",
}
const scoreColor = s => s>=70?S.red:s>=30?S.amber:S.green
const trustColor = s => s>=70?S.green:s>=40?S.amber:S.red
const statusStyles = {
  detected:{color:S.amber,bg:S.amberBg,label:'DETECTED'},
  under_review:{color:S.blue,bg:S.blueBg,label:'REVIEWING'},
  confirmed:{color:S.red,bg:S.redBg,label:'CONFIRMED'},
  dismissed:{color:S.tx3,bg:'rgba(85,85,95,.08)',label:'DISMISSED'},
  resolved:{color:S.green,bg:S.greenBg,label:'RESOLVED'},
}
const FRAUD_TYPE_LABELS = {
  courier_fraud:'Courier Fraud',seller_fraud:'Seller Fraud',multi_signal:'Multi-Signal',
  rfid_mismatch:'RFID Mismatch',weight_fraud:'Weight Fraud',dimension_fraud:'Dim. Fraud',
}
function timeAgo(d){const diff=Date.now()-new Date(d).getTime(),h=Math.floor(diff/36e5),day=Math.floor(diff/864e5);return day>0?`${day}d ago`:h>0?`${h}h ago`:'just now'}

const MOCK = {
  kpis:{total_parcels:30,total_fraud_events:12,open_inquiries:4,high_risk_parcels:7,avg_seller_trust:71.4,avg_courier_trust:76.8,fraud_rate_percent:40.0},
  events:[
    {id:'fe1',tracking:'PGM2J7R5',fraud_type:'courier_fraud',score:84.2,status:'detected',city:'Mumbai, MH',detected_at:'2024-01-17T14:32:00'},
    {id:'fe2',tracking:'PGQ5P6T9',fraud_type:'multi_signal',score:91.0,status:'confirmed',city:'Delhi, DL',detected_at:'2024-01-17T11:05:00'},
    {id:'fe3',tracking:'PGB2K8X1',fraud_type:'rfid_mismatch',score:78.5,status:'under_review',city:'Bengaluru, KA',detected_at:'2024-01-16T16:20:00'},
    {id:'fe4',tracking:'PGY4N3W7',fraud_type:'weight_fraud',score:62.1,status:'detected',city:'Hyderabad, TS',detected_at:'2024-01-16T09:44:00'},
    {id:'fe5',tracking:'PGH6P1Q2',fraud_type:'seller_fraud',score:55.8,status:'dismissed',city:'Chennai, TN',detected_at:'2024-01-15T18:12:00'},
    {id:'fe6',tracking:'PGR9C5M4',fraud_type:'dimension_fraud',score:48.3,status:'resolved',city:'Pune, MH',detected_at:'2024-01-15T10:30:00'},
    {id:'fe7',tracking:'PGT7L2N9',fraud_type:'courier_fraud',score:93.7,status:'confirmed',city:'Kolkata, WB',detected_at:'2024-01-14T21:55:00'},
    {id:'fe8',tracking:'PGV3K8P5',fraud_type:'multi_signal',score:71.2,status:'under_review',city:'Ahmedabad, GJ',detected_at:'2024-01-14T13:08:00'},
  ],
  sellers:[
    {id:'s5',name:'FakeWatch Palace',trust_score:15.0,fraud_count:9,is_flagged:true,is_suspended:true},
    {id:'s3',name:'BargainBox Ltd',trust_score:42.5,fraud_count:4,is_flagged:true,is_suspended:false},
    {id:'s9',name:'OffBrand Direct',trust_score:29.5,fraud_count:5,is_flagged:true,is_suspended:true},
    {id:'s7',name:'MidnightGoods',trust_score:38.0,fraud_count:3,is_flagged:true,is_suspended:false},
    {id:'s2',name:'QuickShip Co',trust_score:65.0,fraud_count:2,is_flagged:true,is_suspended:false},
  ],
  couriers:[
    {id:'c5',name:'Omar Hassan',employee_id:'EMP-0018',trust_score:29.0,fraud_count:4,is_flagged:true},
    {id:'c3',name:'Dmitri Volkov',employee_id:'EMP-0031',trust_score:61.5,fraud_count:2,is_flagged:true},
    {id:'c7',name:'Rico Espinoza',employee_id:'EMP-0055',trust_score:44.0,fraud_count:3,is_flagged:true},
    {id:'c8',name:'Tanya Blume',employee_id:'EMP-0072',trust_score:51.5,fraud_count:1,is_flagged:false},
  ],
}

function Kpi({icon,label,value,sub,color,delta}){
  return(
    <div style={{background:S.s1,border:`1px solid ${S.bd}`,borderRadius:10,padding:'1.1rem',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:color}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.5rem'}}>
        <span style={{fontSize:'1rem'}}>{icon}</span>
        {delta!=null&&<span style={{fontSize:'.54rem',color:delta>=0?S.red:S.green,fontFamily:S.font}}>{delta>=0?'▲':'▼'}{Math.abs(delta)}%</span>}
      </div>
      <div style={{fontFamily:S.title,fontSize:'1.9rem',color,lineHeight:1,marginBottom:'.3rem'}}>{value}</div>
      <div style={{fontSize:'.56rem',color:S.tx2,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:sub?'.15rem':0}}>{label}</div>
      {sub&&<div style={{fontSize:'.53rem',color:S.tx3}}>{sub}</div>}
    </div>
  )
}

function Modal({event,onClose}){
  const navigate = useNavigate()
  if(!event)return null
  const st=statusStyles[event.status]||statusStyles.detected
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}} onClick={onClose}>
      <div style={{background:S.s1,border:`1px solid ${S.bd2}`,borderRadius:12,padding:'1.5rem',maxWidth:480,width:'100%',animation:'modalIn .2s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.1rem'}}>
          <div>
            <div style={{fontSize:'.53rem',color:S.tx3,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.3rem',fontFamily:S.font}}>Fraud Event</div>
            <div style={{fontFamily:S.title,fontSize:'1.4rem',color:S.tx}}>{event.tracking}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:S.tx3,fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.7rem',marginBottom:'.9rem'}}>
          {[['Type',FRAUD_TYPE_LABELS[event.fraud_type]||event.fraud_type],['Location',event.city],['Detected',timeAgo(event.detected_at)],['Status',st.label]].map(([l,v])=>(
            <div key={l} style={{background:S.s2,borderRadius:7,padding:'.55rem .75rem'}}>
              <div style={{fontSize:'.52rem',color:S.tx3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'.18rem',fontFamily:S.font}}>{l}</div>
              <div style={{fontSize:'.72rem',color:S.tx,fontFamily:S.font}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{background:S.s2,borderRadius:8,padding:'.85rem',marginBottom:'.9rem'}}>
          <div style={{fontSize:'.53rem',color:S.tx3,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.6rem',fontFamily:S.font}}>Score Breakdown</div>
          <div style={{display:'flex',alignItems:'center',gap:'.8rem',marginBottom:'.55rem'}}>
            <div style={{fontFamily:S.title,fontSize:'2.3rem',color:scoreColor(event.score)}}>{event.score.toFixed(1)}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'.62rem',color:S.tx2,fontFamily:S.font,marginBottom:'.25rem'}}>/ 100</div>
              <div style={{height:5,background:S.bd2,borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${event.score}%`,background:scoreColor(event.score),borderRadius:3}}/>
              </div>
            </div>
          </div>
          {[['Image (40%)',event.score*.4,40],['Weight (25%)',event.score*.25,25],['RFID (20%)',event.score*.2,20],['Dims (15%)',event.score*.15,15]].map(([l,v,m])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.3rem',fontSize:'.58rem',fontFamily:S.font}}>
              <div style={{width:90,color:S.tx2,flexShrink:0}}>{l}</div>
              <div style={{flex:1,height:3,background:S.bd2,borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(v/m)*100}%`,background:scoreColor(v/m*250),borderRadius:2}}/>
              </div>
              <div style={{color:S.tx3,width:28,textAlign:'right'}}>{v.toFixed(0)}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:'.5rem',justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{background:'transparent',border:`1px solid ${S.bd2}`,color:S.tx2,padding:'.42rem .9rem',borderRadius:6,fontSize:'.6rem',cursor:'pointer',fontFamily:S.font}}>Close</button>
          <button onClick={()=>{onClose();navigate('/inquiries')}} style={{background:S.redBg,border:`1px solid ${S.redDim}`,color:S.red,padding:'.42rem .9rem',borderRadius:6,fontSize:'.6rem',cursor:'pointer',fontFamily:S.font}}>Open Inquiry</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard(){
  const [tab,setTab]=useState('fraud')
  const [filterStatus,setFilterStatus]=useState('all')
  const [selected,setSelected]=useState(null)
  const [loaded,setLoaded]=useState(false)
  useEffect(()=>{setTimeout(()=>setLoaded(true),120)},[])
  const {kpis,events,sellers,couriers}=MOCK
  const filtered=filterStatus==='all'?events:events.filter(e=>e.status===filterStatus)

  return(
    <div style={{minHeight:'100vh',background:S.bg,color:S.tx,fontFamily:S.font,padding:'1.5rem 2rem'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Anton&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${S.bd2};border-radius:2px;}
        select option{background:${S.s1};}
      `}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem',paddingBottom:'1.1rem',borderBottom:`1px solid ${S.bd}`}}>
        <div>
          <h1 style={{fontFamily:S.title,fontSize:'2rem',color:S.tx,margin:0,letterSpacing:'.04em'}}>🛡️ ADMIN DASHBOARD</h1>
          <p style={{fontSize:'.57rem',color:S.tx3,margin:'.2rem 0 0',letterSpacing:'.1em',textTransform:'uppercase'}}>Fraud Intelligence Center · Real-Time Monitoring</p>
        </div>
        <div style={{display:'flex',gap:'.7rem',alignItems:'center'}}>
          <div style={{fontSize:'.57rem',color:S.tx3}}>Last updated: just now</div>
          <div style={{display:'flex',alignItems:'center',gap:'.4rem',padding:'.38rem .8rem',background:S.s1,border:`1px solid ${S.bd2}`,borderRadius:6,fontSize:'.57rem',color:S.green}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:S.green,display:'inline-block',animation:'pulse 2s infinite'}}/>LIVE
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'.75rem',marginBottom:'1.7rem',opacity:loaded?1:0,transition:'opacity .5s'}}>
        <Kpi icon="📦" label="Total Parcels"     value={kpis.total_parcels}            color={S.blue}/>
        <Kpi icon="🚨" label="Fraud Events"      value={kpis.total_fraud_events}       color={S.red}   delta={12}/>
        <Kpi icon="🔍" label="Open Inquiries"    value={kpis.open_inquiries}           color={S.amber}/>
        <Kpi icon="⚠"  label="High Risk"         value={kpis.high_risk_parcels}        color={S.red}   delta={8}/>
        <Kpi icon="📊" label="Fraud Rate"        value={`${kpis.fraud_rate_percent}%`} color={S.amber} sub="of all parcels"/>
        <Kpi icon="🏪" label="Seller Trust Avg"  value={kpis.avg_seller_trust}         color={trustColor(kpis.avg_seller_trust)}/>
        <Kpi icon="🚚" label="Courier Trust Avg" value={kpis.avg_courier_trust}        color={trustColor(kpis.avg_courier_trust)}/>
      </div>

      {/* Body grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 310px',gap:'1.1rem'}}>

        {/* Fraud table */}
        <div style={{background:S.s1,border:`1px solid ${S.bd}`,borderRadius:10}}>
          {/* Toolbar */}
          <div style={{padding:'.85rem 1rem',borderBottom:`1px solid ${S.bd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:'.4rem'}}>
              {[['fraud','🚨 Fraud Events'],['inquiries','🔍 Inquiries'],['parcels','📦 Parcels']].map(([key,lbl])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:'.3rem .75rem',borderRadius:5,fontSize:'.57rem',fontFamily:S.font,letterSpacing:'.07em',textTransform:'uppercase',cursor:'pointer',transition:'all .12s',background:tab===key?'rgba(77,159,255,.12)':'transparent',border:tab===key?'1px solid rgba(77,159,255,.3)':`1px solid ${S.bd}`,color:tab===key?S.blue:S.tx3}}>{lbl}</button>
              ))}
            </div>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:S.s2,border:`1px solid ${S.bd2}`,color:S.tx2,padding:'.28rem .55rem',borderRadius:5,fontSize:'.57rem',fontFamily:S.font,outline:'none',cursor:'pointer'}}>
              <option value="all">All Status</option>
              <option value="detected">Detected</option>
              <option value="under_review">Under Review</option>
              <option value="confirmed">Confirmed</option>
              <option value="dismissed">Dismissed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Column headers */}
          <div style={{display:'grid',gridTemplateColumns:'110px 1fr 130px 65px 90px 75px',gap:'.5rem',padding:'.42rem 1rem',fontSize:'.52rem',letterSpacing:'.1em',textTransform:'uppercase',color:S.tx3,borderBottom:`1px solid ${S.bd}`}}>
            <span>Tracking</span><span>Type / Location</span><span>Status</span><span>Score</span><span>When</span><span>Action</span>
          </div>

          {filtered.map(ev=>{
            const st=statusStyles[ev.status]||statusStyles.detected
            return(
              <div key={ev.id} style={{display:'grid',gridTemplateColumns:'110px 1fr 130px 65px 90px 75px',gap:'.5rem',alignItems:'center',padding:'.52rem 1rem',borderBottom:`1px solid ${S.bd}`,fontSize:'.65rem',cursor:'pointer',transition:'background .1s'}}
                onClick={()=>setSelected(ev)}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{color:S.blue,fontWeight:700,letterSpacing:'.04em'}}>{ev.tracking}</div>
                <div>
                  <div style={{color:S.tx}}>{FRAUD_TYPE_LABELS[ev.fraud_type]||ev.fraud_type}</div>
                  <div style={{color:S.tx3,fontSize:'.57rem',marginTop:1}}>{ev.city}</div>
                </div>
                <div><span style={{display:'inline-block',padding:'.13rem .45rem',borderRadius:3,fontSize:'.52rem',letterSpacing:'.05em',background:st.bg,color:st.color}}>{st.label}</span></div>
                <div style={{fontFamily:S.title,fontSize:'.95rem',color:scoreColor(ev.score)}}>{ev.score.toFixed(0)}</div>
                <div style={{color:S.tx3,fontSize:'.58rem'}}>{timeAgo(ev.detected_at)}</div>
                <div>
                  <button onClick={e=>{e.stopPropagation();setSelected(ev)}} style={{background:'transparent',border:`1px solid ${S.bd2}`,color:S.blue,padding:'.18rem .45rem',borderRadius:4,fontSize:'.52rem',cursor:'pointer',fontFamily:S.font}}
                    onMouseEnter={e=>{e.target.style.borderColor=S.blue;e.target.style.background=S.blueBg}}
                    onMouseLeave={e=>{e.target.style.borderColor=S.bd2;e.target.style.background='transparent'}}>
                    VIEW
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length===0&&<div style={{textAlign:'center',padding:'3rem',color:S.tx3,fontSize:'.65rem'}}>No events for this filter</div>}
        </div>

        {/* Sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

          {/* Risky sellers */}
          <div style={{background:S.s1,border:`1px solid ${S.bd}`,borderRadius:10,padding:'.95rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.8rem',paddingBottom:'.55rem',borderBottom:`1px solid ${S.bd}`}}>
              <span style={{fontSize:'.56rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:S.amber}}>🏪 HIGH RISK SELLERS</span>
              <span style={{fontSize:'.5rem',color:S.tx3}}>by trust score</span>
            </div>
            {sellers.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.42rem 0',borderBottom:`1px solid ${S.bd}`}}>
                <div style={{width:26,height:26,borderRadius:5,flexShrink:0,background:s.is_suspended?S.redBg:S.amberBg,border:`1px solid ${s.is_suspended?S.redDim:S.amberDim}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem'}}>🏪</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.22rem'}}>
                    <span style={{fontSize:'.65rem',color:S.tx,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</span>
                    <span style={{fontFamily:S.title,fontSize:'.85rem',color:trustColor(s.trust_score),flexShrink:0,marginLeft:'.4rem'}}>{s.trust_score}</span>
                  </div>
                  <div style={{height:3,background:S.bd2,borderRadius:2,overflow:'hidden',marginBottom:'.2rem'}}>
                    <div style={{height:'100%',width:`${s.trust_score}%`,background:trustColor(s.trust_score),borderRadius:2}}/>
                  </div>
                  <div style={{display:'flex',gap:'.4rem',fontSize:'.52rem'}}>
                    <span style={{color:S.tx3}}>{s.fraud_count} events</span>
                    {s.is_flagged&&<span style={{color:S.amber}}>⚠ FLAGGED</span>}
                    {s.is_suspended&&<span style={{color:S.red}}>🚫 SUSPENDED</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Risky couriers */}
          <div style={{background:S.s1,border:`1px solid ${S.bd}`,borderRadius:10,padding:'.95rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.8rem',paddingBottom:'.55rem',borderBottom:`1px solid ${S.bd}`}}>
              <span style={{fontSize:'.56rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:S.red}}>🚚 HIGH RISK COURIERS</span>
              <span style={{fontSize:'.5rem',color:S.tx3}}>by trust score</span>
            </div>
            {couriers.map(c=>(
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.42rem 0',borderBottom:`1px solid ${S.bd}`}}>
                <div style={{width:26,height:26,borderRadius:5,flexShrink:0,background:c.is_flagged?S.redBg:S.greenBg,border:`1px solid ${c.is_flagged?S.redDim:'#0d5c30'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem'}}>🚚</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.22rem'}}>
                    <span style={{fontSize:'.65rem',color:S.tx,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                    <span style={{fontFamily:S.title,fontSize:'.85rem',color:trustColor(c.trust_score),flexShrink:0,marginLeft:'.4rem'}}>{c.trust_score}</span>
                  </div>
                  <div style={{height:3,background:S.bd2,borderRadius:2,overflow:'hidden',marginBottom:'.2rem'}}>
                    <div style={{height:'100%',width:`${c.trust_score}%`,background:trustColor(c.trust_score),borderRadius:2}}/>
                  </div>
                  <div style={{display:'flex',gap:'.4rem',fontSize:'.52rem'}}>
                    <span style={{color:S.tx3}}>{c.employee_id} · {c.fraud_count} events</span>
                    {c.is_flagged&&<span style={{color:S.amber}}>⚠ FLAGGED</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fraud type breakdown */}
          <div style={{background:S.s1,border:`1px solid ${S.bd}`,borderRadius:10,padding:'.95rem'}}>
            <div style={{fontSize:'.56rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:S.tx2,marginBottom:'.75rem'}}>📊 BY FRAUD TYPE</div>
            {[['Courier Fraud',4,S.red],['Multi-Signal',3,S.amber],['RFID Mismatch',2,S.blue],['Weight Fraud',2,S.amber],['Seller Fraud',1,S.red]].map(([l,c,col])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:'.55rem',marginBottom:'.4rem'}}>
                <div style={{width:82,fontSize:'.57rem',color:S.tx2,flexShrink:0}}>{l}</div>
                <div style={{flex:1,height:4,background:S.bd2,borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(c/4)*100}%`,background:col,borderRadius:2}}/>
                </div>
                <div style={{fontSize:'.57rem',color:col,width:12,textAlign:'right',flexShrink:0}}>{c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected&&<Modal event={selected} onClose={()=>setSelected(null)}/>}
    </div>
  )
}