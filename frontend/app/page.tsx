// 작업목록 | 작업상세+탭 | 영상미리보기 — 3열 레이아웃
"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  startGenerate, getStatusEventSource, getVideoUrl,
  listJobs, getJobInfo, getJobImageUrl, getJobAudioUrl, triggerRender,
  generateScript, createDraft, runJob, deleteJob, regenerateImage, getVoiceSampleUrl, cancelJob,
  updateSceneChunks, updateSubtitleAlign, JobSummary, JobInfo,
} from "@/lib/api"

// ── 상수 ─────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "title",             label: "제목",    statuses: [] as string[] },
  { key: "parsing",           label: "스크립트", statuses: ["parsing"] },
  { key: "generating_images", label: "검수",     statuses: ["generating_images","generating_audio","assembling"] },
  { key: "rendering",         label: "렌더",    statuses: ["rendering"] },
  { key: "done",              label: "완료",    statuses: ["done"] },
]

const STATUS_ORDER = [
  "pending","parsing","generating_images","generating_audio",
  "awaiting_render","assembling","rendering","done",
]

const STATUS_LABEL: Record<string,string> = {
  pending:"대기 중", parsing:"스크립트 분석 중", generating_images:"이미지 생성 중",
  generating_audio:"음성 생성 중", awaiting_render:"이미지 검수 대기",
  assembling:"자막 적용 중", rendering:"렌더링 중", done:"완료", error:"오류", cancelled:"취소됨",
}

// 단계별 어떤 탭을 활성화할지
const STATUS_TO_TAB: Record<string,string> = {
  pending:"title", parsing:"parsing",
  generating_images:"generating_images", generating_audio:"generating_images",
  awaiting_render:"generating_images", assembling:"generating_images",
  rendering:"rendering", done:"done", error:"done",
}

function dotColor(s:string){
  if(s==="done") return "#20cc80"
  if(s==="error"||s==="cancelled") return "#ff4060"
  if(s==="awaiting_render") return "#f0a020"
  if(s==="pending") return "rgba(42,58,96,0.3)"
  return "#2860ff"
}
function timeAgo(iso:string){
  if(!iso) return ""
  const m=Math.floor((Date.now()-new Date(iso).getTime())/60000)
  if(m<1) return "방금"
  if(m<60) return `${m}분 전`
  const h=Math.floor(m/60)
  if(h<24) return `${h}시간 전`
  const d=new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()}`
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

export default function Home(){
  const [view,setView]                   = useState<"create"|"job">("create")
  const [selectedJobId,setSelectedJobId] = useState<string|null>(null)
  const [jobs,setJobs]                   = useState<JobSummary[]>([])
  const [hoveredJobId,setHoveredJobId]   = useState<string|null>(null)

  // 폼
  const [title,setTitle]         = useState("")
  const [script,setScript]       = useState("")
  const [voice,setVoice]         = useState("alloy")
  const [imageStyle,setStyle]    = useState("realistic")
  const [titleConfirmed,setTitleConfirmed]= useState(false)
  const [draftJobId,setDraftJobId]= useState<string|null>(null)
  const [submitting,setSubmitting]= useState(false)
  const [submitError,setSubmitError]= useState("")

  // 선택된 작업 실시간 상태
  const [stepStatus,setStepStatus]= useState("pending")
  const [progress,setProgress]   = useState(0)
  const [message,setMessage]     = useState("")
  const esRef = useRef<EventSource|null>(null)
  const [sseKey,setSseKey]       = useState(0)
  const userPinnedTab            = useRef(false)

  // 탭 + 상세
  const [activeTab,setActiveTab]  = useState("title")
  const [jobInfo,setJobInfo]      = useState<JobInfo|null>(null)
  const [renderLoading,setRenderLoading]= useState(false)
  const [cancelling,setCancelling]     = useState(false)

  // ── 작업 목록 폴링 ────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async()=>{
    const data = await listJobs()
    setJobs(data)
  },[])

  useEffect(()=>{
    fetchJobs()
    const id=setInterval(fetchJobs,3000)
    return()=>clearInterval(id)
  },[fetchJobs])

  // ── 선택된 작업 SSE ───────────────────────────────────────────────────────

  useEffect(()=>{
    esRef.current?.close()
    if(!selectedJobId) return
    const job=jobs.find(j=>j.job_id===selectedJobId)
    // sseKey===0이면 최초 선택 — done/error 잡은 SSE 불필요
    if(sseKey===0&&(!job||job.status==="done"||job.status==="error")){
      setStepStatus(job?.status??"done")
      setProgress(job?.progress??100)
      return
    }
    const es=getStatusEventSource(selectedJobId)
    esRef.current=es
    es.onmessage=(e)=>{
      const d=JSON.parse(e.data)
      const s=d.status??"pending"
      setStepStatus(s)
      setProgress(d.progress??0)
      setMessage(d.message??"")
      if(!userPinnedTab.current) setActiveTab(STATUS_TO_TAB[s]??activeTab)
      if(s==="awaiting_render"||s==="done") getJobInfo(selectedJobId).then(setJobInfo)
      if(s==="done"||s==="error"){ es.close(); fetchJobs() }
    }
    es.onerror=()=>es.close()
    return()=>es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedJobId, sseKey])

  // ── 작업 선택 ────────────────────────────────────────────────────────────

  function selectJob(job:JobSummary){
    userPinnedTab.current = false
    setSelectedJobId(job.job_id)
    setView("job")
    setJobInfo(null)
    setStepStatus(job.status)
    setProgress(job.progress)
    setActiveTab(STATUS_TO_TAB[job.status]??"title")
    setSseKey(0)
  }

  useEffect(()=>{
    setJobInfo(null)
    if(selectedJobId) getJobInfo(selectedJobId).then(setJobInfo)
  },[selectedJobId])

  // ── 탭 클릭 ──────────────────────────────────────────────────────────────

  async function handleTabClick(key:string){
    userPinnedTab.current = true
    setActiveTab(key)
    if(selectedJobId&&!jobInfo){
      const info=await getJobInfo(selectedJobId)
      setJobInfo(info)
    }
  }

  // ── 생성 제출 ────────────────────────────────────────────────────────────

  async function confirmTitle(){
    if(!title.trim()) return
    try{
      const id = await createDraft(title)
      setDraftJobId(id)
      setTitleConfirmed(true)
      await fetchJobs()
      // 사이드바에서 해당 작업 선택
      const job:JobSummary={job_id:id,title,status:"pending",created_at:new Date().toISOString(),progress:0}
      selectJob(job)
    }catch{
      setSubmitError("작업 생성 실패.")
    }
  }

  async function submitJob(){
    if(!draftJobId||!title.trim()) return
    setSubmitting(true); setSubmitError("")
    try{
      const finalScript = script.trim() || await generateScript(title,"")
      await runJob(draftJobId,{title,script:finalScript,voice,image_style:imageStyle})
      await fetchJobs()
      setView("job")
      setTitle(""); setScript(""); setTitleConfirmed(false); setDraftJobId(null)
    }catch{
      setSubmitError("요청 실패. 백엔드를 확인하세요.")
    }finally{
      setSubmitting(false)
    }
  }
  async function handleSubmit(e:React.FormEvent){ e.preventDefault(); await submitJob() }

  // ── 작업 삭제 ────────────────────────────────────────────────────────────

  async function handleDelete(e:React.MouseEvent, jobId:string){
    e.stopPropagation()
    await deleteJob(jobId)
    if(selectedJobId===jobId){ setSelectedJobId(null); setView("create") }
    await fetchJobs()
  }

  // ── pending 작업 실행 ────────────────────────────────────────────────────

  async function handleRunPending(){
    const job = jobs.find(j=>j.job_id===selectedJobId)
    if(!selectedJobId||!job) return
    setSubmitting(true); setSubmitError("")
    try{
      const finalScript = await generateScript(job.title,"")
      await runJob(selectedJobId,{title:job.title,script:finalScript,voice,image_style:imageStyle})
      await fetchJobs()
    }catch{
      setSubmitError("요청 실패. 백엔드를 확인하세요.")
    }finally{
      setSubmitting(false)
    }
  }

  // ── 렌더 시작 ────────────────────────────────────────────────────────────

  async function handleCancel(){
    if(!selectedJobId||cancelling) return
    setCancelling(true)
    try{
      await cancelJob(selectedJobId)
      setStepStatus("cancelled")
      esRef.current?.close()
      await fetchJobs()
    }catch{}
    finally{ setCancelling(false) }
  }

  async function handleRender(){
    if(!selectedJobId) return
    setRenderLoading(true)
    try{
      await triggerRender(selectedJobId)
      setStepStatus("assembling")
      setProgress(80)
      setSseKey(k=>k+1)
    }catch{}
    finally{ setRenderLoading(false) }
  }

  // ── 탭 상태 계산 ─────────────────────────────────────────────────────────

  function tabState(step:typeof PIPELINE_STEPS[0]):"done"|"active"|"pending"{
    if(step.key==="title") return "done"
    if(step.key==="done"&&stepStatus==="done") return "done"
    if(step.statuses.includes(stepStatus)) return "active"
    if(step.key==="generating_images"&&stepStatus==="awaiting_render") return "active"
    const si=STATUS_ORDER.indexOf(step.statuses[0]??"")
    const ci=STATUS_ORDER.indexOf(stepStatus)
    return si<ci?"done":"pending"
  }

  const selectedJob=jobs.find(j=>j.job_id===selectedJobId)
  const videoUrl=selectedJob?.status==="done"?getVideoUrl(selectedJobId!):null

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return(
    <div style={{height:"100vh",display:"flex",background:"#f4f7ff",color:"#0b1120",fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif',overflow:"hidden"}}>

      {/* ── 1열: 사이드바 ────────────────────────────────────────────────── */}
      <nav style={{width:300,minWidth:300,background:"#eaeffc",borderRight:"1px solid #dce4f5",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* 헤더 + 새 작업 버튼 */}
        <div style={{padding:"16px 14px 12px",borderBottom:"1px solid #dce4f5",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:7,background:"#2860ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>✦</div>
          <span style={{fontSize:20,fontWeight:700,flex:1,letterSpacing:"-0.5px"}}>Shorts</span>
          <button
            onClick={()=>{ setView("create"); setTitle(""); setScript(""); setTitleConfirmed(false); setDraftJobId(null); setSubmitError("") }}
            title="새 작업 만들기"
            style={{width:26,height:26,borderRadius:6,background:"rgba(40,96,255,0.18)",border:"1px solid rgba(40,96,255,0.3)",color:"#2860ff",fontSize:18,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}
          >+</button>
        </div>

        {/* 목록 */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
          {jobs.length===0&&(
            <p style={{fontSize:15,color:"rgba(42,58,96,0.35)",textAlign:"center",marginTop:24}}>작업 없음</p>
          )}
          {jobs.map(job=>{
            const isSelected=job.job_id===selectedJobId
            const isRunning=!["done","error","pending","awaiting_render"].includes(job.status)
            const isHovered=hoveredJobId===job.job_id
            const statusColor=job.status==="done"?"#20cc80":job.status==="awaiting_render"?"#f0a020":job.status==="error"?"#ff4060":"#2860ff"
            const statusLabel=job.status==="done"?"완료":job.status==="awaiting_render"?"검수 대기":job.status==="error"?"오류":job.status==="pending"?"대기":STATUS_LABEL[job.status]??job.status
            return(
              <div
                key={job.job_id}
                style={{position:"relative",marginBottom:6}}
                onMouseEnter={()=>setHoveredJobId(job.job_id)}
                onMouseLeave={()=>setHoveredJobId(null)}
              >
                <button
                  onClick={()=>selectJob(job)}
                  style={{
                    width:"100%",textAlign:"left",padding:"11px 12px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",
                    background:isSelected?"rgba(40,96,255,0.16)":"#ffffff",
                    border:`1px solid ${isSelected?"rgba(40,96,255,0.4)":isHovered?"#dce4f5":"#dce4f5"}`,
                    transition:"background 0.15s,border-color 0.15s",
                    boxShadow:isSelected?"0 0 0 1px rgba(40,96,255,0.15) inset":"none",
                  }}
                >
                  {/* 제목 행 */}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,paddingRight:isHovered?16:0,transition:"padding-right 0.15s"}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:dotColor(job.status),flexShrink:0,animation:isRunning?"pulse 1.5s ease-in-out infinite":"none"}}/>
                    <span style={{fontSize:18,fontWeight:600,color:isSelected?"#0b1120":"rgba(42,58,96,0.65)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",flex:1,letterSpacing:"-0.2px"}}>
                      {job.title||"제목 없음"}
                    </span>
                  </div>
                  {/* 상태 + 시간 행 */}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:15,fontWeight:600,color:statusColor,background:`${statusColor}1a`,padding:"2px 7px",borderRadius:20,flexShrink:0}}>{statusLabel}</span>
                    <span style={{fontSize:15,color:"rgba(42,58,96,0.4)",flex:1}}>{timeAgo(job.created_at)}</span>
                    {isRunning&&(
                      <>
                        <div style={{width:40,height:2,background:"#dce4f5",borderRadius:1,overflow:"hidden",flexShrink:0}}>
                          <div style={{height:"100%",width:`${job.progress}%`,background:"#2860ff",borderRadius:1,transition:"width 1s"}}/>
                        </div>
                        <span style={{fontSize:15,color:"#2860ff",fontWeight:600,flexShrink:0}}>{job.progress}%</span>
                      </>
                    )}
                  </div>
                </button>
                {isHovered&&(
                  <button
                    onClick={(e)=>handleDelete(e,job.job_id)}
                    title="삭제"
                    style={{position:"absolute",top:8,right:8,width:18,height:18,borderRadius:4,background:"rgba(255,64,96,0.2)",border:"none",color:"#ff4060",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",padding:0}}
                  >×</button>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── 2열: 영상 미리보기 ──────────────────────────────────────────── */}
      <aside style={{width:400,minWidth:400,background:"#eaeffc",borderLeft:"1px solid #dce4f5",borderRight:"1px solid #dce4f5",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 14px 12px",borderBottom:"1px solid #dce4f5",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20,fontWeight:700,color:"#0b1120",letterSpacing:"-0.5px"}}>미리보기</span>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:20,gap:14}}>
          {videoUrl?(
            <>
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                style={{width:"100%",aspectRatio:"9/16",borderRadius:16,background:"#000",boxShadow:"0 24px 64px rgba(0,0,0,0.8)",maxHeight:"78vh",objectFit:"contain"}}
              />
              <a
                href={videoUrl}
                download="shorts.mp4"
                style={{width:"100%",padding:"11px",borderRadius:10,textAlign:"center",background:"#dce4f5",border:"1px solid #dce4f5",color:"rgba(11,17,32,0.6)",fontSize:15,fontWeight:600,textDecoration:"none",boxSizing:"border-box"}}
              >
                다운로드
              </a>
            </>
          ):(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:36,opacity:0.1,marginBottom:12}}>▶</div>
              <p style={{fontSize:15,color:"rgba(42,58,96,0.3)",margin:0}}>완료된 영상이<br/>여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── 3열: 작업 상세 / 생성 폼 ────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* 상단 고정 헤더 */}
        <div style={{flexShrink:0,borderBottom:"1px solid #dce4f5",background:"rgba(244,247,255,0.7)"}}>

          {/* 선택된 작업 제목 + 진행률 — 탭 위에 표시 */}
          {view==="job"&&selectedJob&&(
            <div style={{padding:"14px 20px 10px",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:dotColor(stepStatus),flexShrink:0}}/>
                <p style={{fontSize:15,fontWeight:600,margin:0,flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",letterSpacing:"-0.3px"}}>
                  {selectedJob.title||"제목 없음"}
                </p>
                <span style={{fontSize:15,color:"rgba(42,58,96,0.6)",flexShrink:0}}>{STATUS_LABEL[stepStatus]??stepStatus}</span>
              </div>
              {/* 진행률 바 — 진행 중인 상태만 표시 */}
              {!["done","error","cancelled","pending","awaiting_render"].includes(stepStatus)&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:3,background:"#dce4f5",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${progress}%`,background:"#2860ff",borderRadius:2,transition:"width 0.8s ease"}}/>
                  </div>
                  <span style={{fontSize:15,fontWeight:600,color:"#2860ff",flexShrink:0,minWidth:30,textAlign:"right"}}>{progress}%</span>
                </div>
              )}
            </div>
          )}

          {/* 파이프라인 탭 — 항상 표시 */}
          <div style={{display:"flex",gap:2,padding:"4px 20px 10px",overflowX:"auto",alignItems:"center"}}>
            {PIPELINE_STEPS.map(step=>{
              const state=tabState(step)
              const isSel=activeTab===step.key&&view==="job"
              const clickable=(state==="done"||state==="active")&&view==="job"
              const bg=isSel?"rgba(220,228,245,0.6)":state==="active"&&view==="job"?"rgba(40,96,255,0.13)":"transparent"
              const color=isSel?"#0b1120":state==="done"&&view==="job"?"#2860ff":state==="active"&&view==="job"?"#0b1120":"rgba(42,58,96,0.4)"
              return(
                <button
                  key={step.key}
                  onClick={()=>clickable&&handleTabClick(step.key)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",background:bg,border:"none",borderRadius:20,color,fontSize:15,fontWeight:isSel?600:500,cursor:clickable?"pointer":"default",transition:"background 0.2s,color 0.2s",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:isSel?"0 1px 3px rgba(0,0,0,0.35)":"none",letterSpacing:"-0.1px"}}
                >
                  {state==="done"&&!isSel&&view==="job"&&(
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{flexShrink:0}}>
                      <path d="M1 4.5L3.3 7L8 2" stroke="#2860ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {state==="active"&&!isSel&&view==="job"&&<div style={{width:5,height:5,borderRadius:"50%",background:"#2860ff",flexShrink:0,animation:"pulse 1.2s ease-in-out infinite"}}/>}
                  {step.label}
                </button>
              )
            })}

            {/* 취소 버튼 — 파이프라인 진행 중일 때 */}
            {view==="job"&&["parsing","generating_images","generating_audio","assembling","rendering"].includes(stepStatus)&&(
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{marginLeft:"auto",flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"5px 14px",background:"rgba(255,64,96,0.15)",border:"1px solid rgba(255,64,96,0.35)",borderRadius:20,color:"#ff4060",fontSize:15,fontWeight:700,cursor:cancelling?"not-allowed":"pointer",opacity:cancelling?0.5:1,transition:"all 0.2s",fontFamily:"inherit",letterSpacing:"-0.1px"}}
              >
                {cancelling?"취소 중…":"■ 취소"}
              </button>
            )}

            {/* 렌더링 버튼 — job 뷰에서 항상 표시 */}
            {view==="job"&&(()=>{
              const canRender=["awaiting_render","done"].includes(stepStatus)&&!renderLoading
              return(
                <button
                  onClick={()=>canRender&&handleRender()}
                  disabled={!canRender}
                  title="렌더링"
                  style={{
                    marginLeft:"auto",flexShrink:0,display:"flex",alignItems:"center",gap:5,
                    padding:"5px 14px",
                    background:canRender?"linear-gradient(135deg,#20cc80,#19a86a)":"#dce4f5",
                    border:"none",borderRadius:20,
                    color:canRender?"#fff":"rgba(42,58,96,0.35)",
                    fontSize:15,fontWeight:700,cursor:canRender?"pointer":"default",
                    transition:"all 0.2s",fontFamily:"inherit",
                    boxShadow:canRender?"0 0 10px rgba(32,204,128,0.4),0 2px 6px rgba(0,0,0,0.3)":"none",
                    letterSpacing:"-0.1px",
                  }}
                >
                  {renderLoading?"렌더 중…":"↺ 렌더링"}
                </button>
              )
            })()}

            {/* 실행 버튼 — create/pending 전용 */}
            {(()=>{
              const isCreate=view==="create"&&titleConfirmed&&!submitting
              const isPending=view==="job"&&stepStatus==="pending"&&!submitting
              const active=isCreate||isPending
              if(!active&&view==="job") return null
              const label=submitting?"스크립트 생성 중…":"실행"
              return(
                <button
                  onClick={()=>{ if(isCreate) submitJob(); else if(isPending) handleRunPending() }}
                  disabled={!active}
                  style={{
                    marginLeft:view==="job"?"8px":"auto",
                    flexShrink:0,display:"flex",alignItems:"center",gap:6,
                    padding:"5px 16px",
                    background:active?"linear-gradient(135deg,#2860ff,#1a4fe0)":"#dce4f5",
                    border:"none",borderRadius:20,
                    color:active?"#fff":"rgba(42,58,96,0.4)",
                    fontSize:15,fontWeight:700,cursor:active?"pointer":"default",
                    transition:"all 0.2s",fontFamily:"inherit",
                    boxShadow:active?"0 0 12px rgba(40,96,255,0.45),0 2px 6px rgba(0,0,0,0.3)":"none",
                    letterSpacing:"-0.1px",
                  }}
                >
                  {active&&!submitting&&(
                    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                      <path d="M0 0L8 5L0 10V0Z"/>
                    </svg>
                  )}
                  {label}
                </button>
              )
            })()}
          </div>

        </div>

        {view==="create"?(
          /* 새 작업 폼 */
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
            <div style={{width:"100%",maxWidth:500}}>
              <p style={{fontSize:22,fontWeight:700,margin:"0 0 28px",letterSpacing:"-0.5px"}}>새 작업 만들기</p>
              <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* 제목 / 키워드 */}
                <div>
                  <FieldLabel>제목 / 키워드</FieldLabel>
                  {titleConfirmed?(
                    <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(40,96,255,0.08)",border:"1px solid rgba(40,96,255,0.25)",borderRadius:11,padding:"11px 14px"}}>
                      <span style={{flex:1,fontSize:15,color:"#0b1120",fontWeight:500}}>{title}</span>
                      <button
                        type="button"
                        onClick={()=>setTitleConfirmed(false)}
                        style={{background:"none",border:"none",color:"#2a3a60",fontSize:15,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px",borderRadius:6,flexShrink:0}}
                      >수정</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:8}}>
                      <input
                        type="text"
                        style={{flex:1,background:"#dce4f5",border:"1px solid #dce4f5",borderRadius:11,padding:"11px 13px",color:"#0b1120",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"}}
                        onFocus={e=>(e.target.style.borderColor="rgba(40,96,255,0.5)")}
                        onBlur={e=>(e.target.style.borderColor="#dce4f5")}
                        onKeyDown={e=>{ if(e.key==="Enter"&&title.trim()){ e.preventDefault(); confirmTitle() } }}
                        placeholder="치매예방과 운동의 관계"
                        value={title}
                        onChange={e=>setTitle(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={!title.trim()}
                        onClick={confirmTitle}
                        style={{padding:"11px 18px",background:"#dce4f5",border:"1px solid #dce4f5",borderRadius:11,color:"rgba(11,17,32,0.7)",fontSize:15,fontWeight:600,cursor:!title.trim()?"not-allowed":"pointer",opacity:!title.trim()?0.4:1,transition:"all 0.2s",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}
                      >
                        입력
                      </button>
                    </div>
                  )}
                </div>

                {/* 스크립트 */}
                <div>
                  <FieldLabel>스크립트</FieldLabel>
                  <textarea
                    style={{width:"100%",height:200,background:"#dce4f5",border:"1px solid #dce4f5",borderRadius:11,padding:"11px 13px",color:"#0b1120",fontSize:15,lineHeight:1.65,resize:"none",boxSizing:"border-box",outline:"none",fontFamily:"inherit",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="rgba(40,96,255,0.5)")}
                    onBlur={e=>(e.target.style.borderColor="#dce4f5")}
                    placeholder="쇼츠로 만들 내용을 입력하거나 AI 작성을 이용하세요..."
                    value={script}
                    onChange={e=>setScript(e.target.value)}
                    required
                  />
                </div>

                {/* 목소리 */}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <FieldLabel>목소리</FieldLabel>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>여성</p>
                    <div style={{display:"flex",gap:8}}>
                      {VOICES_F.map(({v,l,d})=>(
                        <VoiceCard key={v} voice={v} label={l} desc={d} active={voice===v} onSelect={()=>setVoice(v)}/>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>남성</p>
                    <div style={{display:"flex",gap:8}}>
                      {VOICES_M.map(({v,l,d})=>(
                        <VoiceCard key={v} voice={v} label={l} desc={d} active={voice===v} onSelect={()=>setVoice(v)}/>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 이미지 스타일 */}
                <div>
                  <FieldLabel>이미지 스타일</FieldLabel>
                  <StyleCards imageStyle={imageStyle} setImageStyle={setStyle}/>
                </div>

                {submitError&&<p style={{color:"#ff4060",fontSize:15,margin:0}}>{submitError}</p>}
              </form>
            </div>
          </div>
        ):selectedJob?(
          /* 작업 상세 */
          <>
            {/* 탭 내용 */}
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
              <TabContent
                tab={activeTab}
                jobId={selectedJobId!}
                jobInfo={jobInfo}
                stepStatus={stepStatus}
                progress={progress}
                message={message}
                videoUrl={videoUrl}
                onRender={handleRender}
                renderLoading={renderLoading}
                imageStyle={imageStyle}
                setImageStyle={setStyle}
              />
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <p style={{color:"rgba(42,58,96,0.3)",fontSize:15}}>← 작업을 선택하거나 새 작업을 만드세요</p>
          </div>
        )}
      </div>



      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── 자막 청크 분리 (assembler.py와 동일 로직) ────────────────────────────────
function splitToChunks(text: string): string[] {
  const sentences = text.trim().split(/(?<=[.!?。])\s*/).filter(s => s.trim())
  const base = sentences.length > 0 ? sentences : [text.trim()]
  const chunks: string[] = []
  for (const sent of base) {
    const parts = sent.split(/(?<=[,，])\s*/).filter(p => p.trim())
    chunks.push(...(parts.length > 0 ? parts : [sent.trim()]))
  }
  return chunks.filter(c => c).length > 0 ? chunks.filter(c => c) : [text.trim()]
}

// ── 탭 내용 ──────────────────────────────────────────────────────────────────

function TabContent({tab,jobId,jobInfo,stepStatus,progress,message,videoUrl,onRender,renderLoading,imageStyle,setImageStyle}:{
  tab:string; jobId:string; jobInfo:JobInfo|null
  stepStatus:string; progress:number; message:string
  videoUrl:string|null; onRender:()=>void; renderLoading:boolean
  imageStyle:string; setImageStyle:(v:string)=>void
}){
  const [cacheBust,setCacheBust] = useState<Record<number,number>>({})
  const [chunkEdits,setChunkEdits] = useState<Record<number,string[]>>({})
  const [subtitleAlign,setSubtitleAlign] = useState<string>("center")
  useEffect(()=>{ if(jobInfo?.subtitle_align) setSubtitleAlign(jobInfo.subtitle_align) },[jobInfo?.subtitle_align])

  if(tab==="title") return(
    <div style={{maxWidth:560}}>
      <p style={{fontSize:15,fontWeight:600,color:"#2a3a60",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 12px"}}>원본 스크립트</p>
      <p style={{fontSize:15,color:"rgba(11,17,32,0.7)",lineHeight:1.8,whiteSpace:"pre-wrap",margin:0}}>
        {jobInfo?.script??<span style={{color:"rgba(42,58,96,0.4)"}}>로딩 중...</span>}
      </p>
    </div>
  )

  if(tab==="parsing") return(
    <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:560}}>
      {jobInfo?.scenes?.map((scene,i)=>(
        <div key={i} style={{background:"#ffffff",border:"1px solid #dce4f5",borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
            <span style={{fontSize:15,fontWeight:700,color:"#2860ff",background:"rgba(40,96,255,0.15)",padding:"2px 8px",borderRadius:20,flexShrink:0}}>씬 {i+1}</span>
            <p style={{fontSize:15,color:"#0b1120",margin:0,lineHeight:1.65}}>{scene.narration}</p>
          </div>
          <p style={{fontSize:15,color:"#2a3a60",margin:0,fontStyle:"italic"}}>{scene.image_prompt}</p>
        </div>
      ))??<Gray>스크립트 분석 전입니다.</Gray>}
    </div>
  )

  if(tab==="generating_images") return(
    <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:860}}>
      {/* 자막 정렬 */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:15,color:"#2a3a60",flexShrink:0}}>자막 정렬</span>
        <div style={{display:"flex",gap:4}}>
          {([["left","≡ 좌"],["center","≡ 중"],["right","우 ≡"]] as const).map(([v,label])=>{
            const sel=subtitleAlign===v
            return(
              <button key={v} onClick={async()=>{ setSubtitleAlign(v); await updateSubtitleAlign(jobId,v) }}
                style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${sel?"rgba(40,96,255,0.6)":"#dce4f5"}`,background:sel?"rgba(40,96,255,0.18)":"#ffffff",color:sel?"#2860ff":"rgba(42,58,96,0.7)",fontSize:15,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
              >{label}</button>
            )
          })}
        </div>
        <span style={{fontSize:15,color:"rgba(42,58,96,0.35)"}}>재렌더링 시 적용됩니다.</span>
      </div>
      <SceneCards jobId={jobId} jobInfo={jobInfo} cacheBust={cacheBust} setCacheBust={setCacheBust} chunkEdits={chunkEdits} setChunkEdits={setChunkEdits}/>
    </div>
  )

  if(tab==="rendering") return(
    <div style={{maxWidth:400}}>
      <p style={{fontSize:15,color:"#2a3a60",margin:"0 0 16px"}}>{message||"영상을 렌더링 중입니다..."}</p>
      <div style={{background:"#dce4f5",borderRadius:4,height:3}}>
        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#2860ff,#1a4fe0)",borderRadius:4,transition:"width 0.8s"}}/>
      </div>
      <p style={{fontSize:15,color:"rgba(42,58,96,0.4)",marginTop:8}}>{progress}%</p>
    </div>
  )

  if(tab==="done") return(
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:480}}>
      {/* 완료 배너 */}
      <div style={{background:"rgba(32,204,128,0.08)",border:"1px solid rgba(32,204,128,0.2)",borderRadius:14,padding:"22px 24px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(32,204,128,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✓</div>
        <div style={{flex:1}}>
          <p style={{fontSize:16,fontWeight:700,color:"#20cc80",margin:"0 0 4px"}}>영상 완료!</p>
          <p style={{fontSize:15,color:"rgba(42,58,96,0.7)",margin:0}}>오른쪽 미리보기에서 영상을 확인하고 다운로드하세요.</p>
        </div>
      </div>

      {videoUrl&&(
        <a
          href={videoUrl}
          download="shorts.mp4"
          style={{padding:"14px",background:"linear-gradient(180deg,rgba(32,204,128,0.25),rgba(32,204,128,0.15))",border:"1px solid rgba(32,204,128,0.3)",borderRadius:12,color:"#20cc80",fontSize:15,fontWeight:700,textAlign:"center",textDecoration:"none",letterSpacing:"-0.2px"}}
        >
          완료 — 영상 다운로드
        </a>
      )}
    </div>
  )

  // 기타 (진행 중 단계)
  return(
    <div style={{maxWidth:400}}>
      <p style={{fontSize:15,color:"rgba(42,58,96,0.7)",margin:"0 0 16px"}}>{message||"처리 중..."}</p>
      <div style={{background:"#dce4f5",borderRadius:4,height:3}}>
        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#2860ff,#1a4fe0)",borderRadius:4,transition:"width 0.8s"}}/>
      </div>
      <p style={{fontSize:15,color:"rgba(42,58,96,0.4)",marginTop:8}}>{progress}%</p>
    </div>
  )
}

// ── 씬 카드 (이미지 + TTS + 자막 통합) ─────────────────────────────────────────

function SceneCards({jobId,jobInfo,cacheBust,setCacheBust,chunkEdits,setChunkEdits}:{
  jobId:string; jobInfo:JobInfo|null;
  cacheBust:Record<number,number>; setCacheBust:React.Dispatch<React.SetStateAction<Record<number,number>>>;
  chunkEdits:Record<number,string[]>; setChunkEdits:React.Dispatch<React.SetStateAction<Record<number,string[]>>>;
}){
  const [lightbox,setLightbox]     = useState<number|null>(null)
  const [regenLoading,setRegenLoading] = useState<Set<number>>(new Set())

  async function handleRegen(e:React.MouseEvent, i:number){
    e.stopPropagation()
    setRegenLoading(prev=>new Set(prev).add(i))
    try{
      await regenerateImage(jobId,i)
      setCacheBust(prev=>({...prev,[i]:Date.now()}))
    }catch{}
    finally{
      setRegenLoading(prev=>{ const s=new Set(prev); s.delete(i); return s })
    }
  }

  if(!jobInfo||jobInfo.image_count===0) return <Gray>이미지 생성 전입니다.</Gray>

  return(
    <>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {Array.from({length:jobInfo.image_count}).map((_,i)=>{
          const loading=regenLoading.has(i)
          const imgUrl=getJobImageUrl(jobId,i)+(cacheBust[i]?`?t=${cacheBust[i]}`:"")
          const scene=jobInfo.scenes?.[i]
          const chunks = chunkEdits[i] ?? scene?.subtitle_chunks ?? (scene?.narration ? splitToChunks(scene.narration) : [])
          const saveChunks = async (updated: string[]) => { await updateSceneChunks(jobId, i, updated) }

          return(
            <div key={i} style={{display:"flex",gap:16,background:"#ffffff",border:"1px solid #dce4f5",borderRadius:12,padding:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                <div style={{position:"relative"}}>
                  <button
                    onClick={()=>setLightbox(i)}
                    style={{position:"relative",background:"none",border:"none",padding:0,cursor:"pointer",borderRadius:10,overflow:"hidden",display:"block"}}
                  >
                    {loading?(
                      <div style={{width:160,aspectRatio:"9/16",background:"#dce4f5",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{width:20,height:20,border:"2px solid rgba(42,58,96,0.3)",borderTopColor:"#2860ff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                      </div>
                    ):(
                      <img src={imgUrl} alt={`씬 ${i+1}`} style={{width:160,aspectRatio:"9/16",objectFit:"cover",display:"block",borderRadius:10}}/>
                    )}
                  </button>
                  <button
                    onClick={(e)=>handleRegen(e,i)}
                    disabled={loading}
                    title="이미지 재생성"
                    style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:6,background:"rgba(0,0,0,0.7)",border:"1px solid rgba(42,58,96,0.4)",color:"#fff",fontSize:15,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,opacity:loading?0.5:1,transition:"opacity 0.15s"}}
                  >↺</button>
                </div>
                <span style={{fontSize:15,fontWeight:700,color:"#2860ff",background:"rgba(40,96,255,0.15)",padding:"1px 7px",borderRadius:20,textAlign:"center"}}>씬 {i+1}</span>
              </div>

              <div style={{flex:1,display:"flex",flexDirection:"column",gap:10,minWidth:0}}>
                <audio controls src={getJobAudioUrl(jobId,i)} style={{width:"100%",height:32}}/>

                
                <div style={{background:"#eaeffc",border:"1px solid #dce4f5",borderRadius:8,padding:"8px 10px"}}>
                  <p style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>자막</p>
                  <p style={{fontSize:15,color:"#2a3a60",lineHeight:1.55,margin:0}}>
                    {scene?.narration??<span style={{color:"rgba(42,58,96,0.4)"}}>내용 없음</span>}
                  </p>
                </div>

                {/* 자막 청크 */}
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",textTransform:"uppercase",letterSpacing:"0.06em"}}>자막 분할</span>
                    <span style={{fontSize:15,color:"rgba(42,58,96,0.3)"}}>{chunks.length}개 청크</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {chunks.map((chunk,ci)=>(
                      <div key={ci} style={{display:"flex",gap:4,alignItems:"flex-start"}}>
                        <span style={{fontSize:12,color:"rgba(42,58,96,0.4)",marginTop:5,minWidth:12,textAlign:"right",flexShrink:0}}>{ci+1}</span>
                        <textarea
                          value={chunk}
                          rows={1}
                          ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px" } }}
                          onChange={e=>{
                            const updated=[...chunks]; updated[ci]=e.target.value
                            setChunkEdits(prev=>({...prev,[i]:updated}))
                            e.target.style.height="auto"
                            e.target.style.height=e.target.scrollHeight+"px"
                          }}
                          onBlur={async()=>{ await saveChunks(chunks) }}
                          style={{width:240,flexShrink:0,background:"#dce4f5",border:"1px solid #dce4f5",borderRadius:5,padding:"3px 6px",color:"#0b1120",fontSize:15,lineHeight:1.4,resize:"none",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
                          onFocus={e=>{ e.target.style.borderColor="rgba(40,96,255,0.5)"; e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px" }}
                          onBlurCapture={e=>{ e.currentTarget.style.borderColor="#dce4f5" }}
                        />
                        <button
                          onClick={async()=>{
                            const updated=chunks.filter((_,j)=>j!==ci)
                            setChunkEdits(prev=>({...prev,[i]:updated}))
                            await saveChunks(updated)
                          }}
                          title="삭제"
                          style={{marginTop:3,width:16,height:16,borderRadius:3,background:"rgba(255,64,96,0.12)",border:"1px solid rgba(255,64,96,0.2)",color:"rgba(255,80,70,0.7)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"inherit",padding:0}}
                        >×</button>
                      </div>
                    ))}
                    <button
                      onClick={async()=>{
                        const updated=[...chunks,""]
                        setChunkEdits(prev=>({...prev,[i]:updated}))
                        await saveChunks(updated)
                      }}
                      style={{padding:"3px 8px",background:"#dce4f5",border:"1px dashed rgba(220,228,245,0.8)",borderRadius:6,color:"#2a3a60",fontSize:15,cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"fit-content"}}
                    >+ 청크 추가</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 라이트박스 */}
      {lightbox!==null&&(
        <div
          onClick={()=>setLightbox(null)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",gap:32,padding:32}}
        >
          <button
            onClick={(e)=>{ e.stopPropagation(); setLightbox(l=>l!==null&&l>0?l-1:l) }}
            style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#f4f7ff",fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}
          >‹</button>

          <div onClick={e=>e.stopPropagation()} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,maxHeight:"90vh"}}>
            <img
              src={getJobImageUrl(jobId,lightbox)+(cacheBust[lightbox]?`?t=${cacheBust[lightbox]}`:"")}
              alt=""
              style={{maxHeight:"75vh",maxWidth:"min(480px,80vw)",aspectRatio:"9/16",objectFit:"contain",borderRadius:14,boxShadow:"0 32px 80px rgba(0,0,0,0.8)"}}
            />
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <span style={{fontSize:15,color:"#2a3a60"}}>씬 {lightbox+1} / {jobInfo.image_count}</span>
              <button
                onClick={(e)=>handleRegen(e,lightbox)}
                disabled={regenLoading.has(lightbox)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"rgba(40,96,255,0.2)",border:"1px solid rgba(40,96,255,0.4)",borderRadius:10,color:"#2860ff",fontSize:15,fontWeight:600,cursor:regenLoading.has(lightbox)?"not-allowed":"pointer",opacity:regenLoading.has(lightbox)?0.5:1,fontFamily:"inherit"}}
              >
                {regenLoading.has(lightbox)?(
                  <div style={{width:14,height:14,border:"2px solid rgba(40,96,255,0.3)",borderTopColor:"#2860ff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                ):"↺"} 재생성
              </button>
            </div>
            <p style={{fontSize:15,color:"rgba(42,58,96,0.5)",fontStyle:"italic",margin:0,maxWidth:400,textAlign:"center"}}>
              {jobInfo.scenes?.[lightbox]?.narration}
            </p>
          </div>

          <button
            onClick={(e)=>{ e.stopPropagation(); setLightbox(l=>l!==null&&l<jobInfo.image_count-1?l+1:l) }}
            style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#f4f7ff",fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}
          >›</button>

          <button
            onClick={()=>setLightbox(null)}
            style={{position:"absolute",top:20,right:20,width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"none",color:"rgba(244,247,255,0.6)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
          >✕</button>
        </div>
      )}
    </>
  )
}

// ── 공용 ──────────────────────────────────────────────────────────────────────

// ── 오디오 싱글톤 ─────────────────────────────────────────────────────────────
let _sampleAudio: HTMLAudioElement | null = null
function stopSampleAudio(){ if(_sampleAudio){ _sampleAudio.pause(); _sampleAudio=null } }

// ── VoiceSelector (툴바 팝오버) ───────────────────────────────────────────────

const VOICES_F = [
  {v:"alloy",   l:"Alloy",   d:"차분하고 안정적인"},
  {v:"nova",    l:"Nova",    d:"따뜻하고 친근한"},
  {v:"shimmer", l:"Shimmer", d:"밝고 활기찬"},
]
const VOICES_M = [
  {v:"echo",  l:"Echo",  d:"또렷하고 밝은"},
  {v:"onyx",  l:"Onyx",  d:"깊고 중후한"},
  {v:"fable", l:"Fable", d:"부드럽고 서정적인"},
]
const VOICES = [...VOICES_F, ...VOICES_M]

function VoiceSelector({voice,setVoice}:{voice:string;setVoice:(v:string)=>void}){
  const [open,setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = VOICES.find(x=>x.v===voice)!

  useEffect(()=>{
    function close(e:MouseEvent){ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown",close)
    return()=>document.removeEventListener("mousedown",close)
  },[])

  return(
    <div ref={ref} style={{position:"relative"}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px 5px 10px",background:open?"#dce4f5":"#dce4f5",border:"1px solid #dce4f5",borderRadius:8,cursor:"pointer",fontFamily:"inherit",color:"#0b1120",fontSize:15,fontWeight:600,transition:"all 0.15s"}}
      >
        <span>🎙</span>
        <span>{current.l}</span>
        <span style={{fontSize:12,color:"rgba(42,58,96,0.7)",marginLeft:2}}>▾</span>
      </button>

      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:200,background:"#eaeffc",border:"1px solid #dce4f5",borderRadius:14,padding:8,display:"flex",flexDirection:"column",gap:5,boxShadow:"0 20px 60px rgba(0,0,0,0.7)",backdropFilter:"blur(20px)",width:260}}>
          <p style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px 6px"}}>목소리 선택</p>
          {VOICES.map(({v,l,d})=>(
            <VoiceCard key={v} voice={v} label={l} desc={d} active={voice===v} onSelect={()=>{setVoice(v);setOpen(false)}}/>
          ))}
        </div>
      )}
    </div>
  )
}

function VoiceCard({voice,label,desc,active,onSelect}:{voice:string;label:string;desc:string;active:boolean;onSelect:()=>void}){
  const [audioState,setAudioState] = useState<"idle"|"loading"|"playing">("idle")

  useEffect(()=>()=>{ stopSampleAudio(); setAudioState("idle") },[])

  function handlePlay(e:React.MouseEvent){
    e.stopPropagation()
    if(audioState==="loading") return
    if(audioState==="playing"){ stopSampleAudio(); setAudioState("idle"); return }
    stopSampleAudio()
    setAudioState("loading")
    const a = new Audio(getVoiceSampleUrl(voice))
    _sampleAudio = a
    a.onended = ()=>setAudioState("idle")
    a.onerror = ()=>setAudioState("idle")
    a.play()
      .then(()=>setAudioState("playing"))
      .catch(()=>setAudioState("idle"))
  }

  return(
    <button
      onClick={onSelect}
      style={{width:"100%",padding:"10px 12px",background:active?"rgba(40,96,255,0.14)":"#ffffff",border:`1px solid ${active?"rgba(40,96,255,0.4)":"#dce4f5"}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s",textAlign:"left"}}
    >
      <div style={{flex:1}}>
        <p style={{fontSize:15,fontWeight:700,color:active?"#2860ff":"#0b1120",margin:"0 0 2px"}}>{label}</p>
        <p style={{fontSize:15,color:"#2a3a60",margin:0}}>{desc}</p>
      </div>
      <button
        onClick={handlePlay}
        title="샘플 재생"
        style={{width:28,height:28,borderRadius:"50%",background:audioState==="playing"?"rgba(40,96,255,0.4)":"#dce4f5",border:`1px solid ${audioState==="playing"?"rgba(40,96,255,0.6)":"rgba(220,228,245,0.8)"}`,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,transition:"all 0.15s",padding:0}}
      >
        {audioState==="loading"
          ? <div style={{width:10,height:10,border:"1.5px solid rgba(42,58,96,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          : audioState==="playing" ? "■" : "▶"}
      </button>
    </button>
  )
}

// ── StyleCards (이미지 스타일 카드) ───────────────────────────────────────────

const STYLE_META: Record<string,{label:string;desc:string;gradient:string}> = {
  realistic: {label:"사실적", desc:"실제 사진처럼 디테일하게", gradient:"linear-gradient(160deg,#1a3a2a,#2d6a4f,#95b8a0,#d4a96a)"},
  animation: {label:"애니",   desc:"일러스트·만화 스타일로",  gradient:"linear-gradient(160deg,#1a0533,#6a22b8,#e040c8,#ff9f43)"},
  minimal:   {label:"미니멀", desc:"깔끔하고 단순하게",        gradient:"linear-gradient(160deg,#111,#2a2a2a,#666,#aaa)"},
}

function StyleCards({imageStyle,setImageStyle}:{imageStyle:string;setImageStyle:(v:string)=>void}){
  return(
    <div style={{display:"flex",gap:8}}>
      {Object.entries(STYLE_META).map(([key,meta])=>{
        const active=imageStyle===key
        return(
          <button
            key={key}
            onClick={()=>setImageStyle(key)}
            style={{flex:1,padding:0,background:"none",cursor:"pointer",fontFamily:"inherit",border:`2px solid ${active?"#2860ff":"#dce4f5"}`,borderRadius:12,overflow:"hidden",transition:"border-color 0.2s",boxShadow:active?"0 0 0 1px rgba(40,96,255,0.2)":"none"}}
          >
            <div style={{height:70,background:meta.gradient,position:"relative"}}>
              {active&&<div style={{position:"absolute",top:6,right:6,width:16,height:16,borderRadius:"50%",background:"#2860ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>✓</div>}
            </div>
            <div style={{padding:"8px 10px",background:"#ffffff",textAlign:"left"}}>
              <p style={{fontSize:15,fontWeight:700,color:active?"#2860ff":"#0b1120",margin:"0 0 1px"}}>{meta.label}</p>
              <p style={{fontSize:15,color:"#2a3a60",margin:0}}>{meta.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function OptionGroup({label,children}:{label:string;children:React.ReactNode}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:15,fontWeight:600,color:"rgba(42,58,96,0.5)",letterSpacing:"0.06em",textTransform:"uppercase",flexShrink:0}}>{label}</span>
      <div style={{display:"flex",gap:2,background:"#dce4f5",borderRadius:8,padding:2}}>{children}</div>
    </div>
  )
}
function SegBtn({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){
  return(
    <button
      type="button"
      onClick={onClick}
      style={{padding:"3px 10px",background:active?"#dce4f5":"transparent",border:"none",borderRadius:6,color:active?"#0b1120":"#2a3a60",fontSize:15,fontWeight:active?600:400,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",boxShadow:active?"0 1px 2px rgba(0,0,0,0.3)":"none"}}
    >{children}</button>
  )
}
function Gray({children}:{children:React.ReactNode}){
  return <p style={{fontSize:15,color:"rgba(42,58,96,0.4)",margin:0}}>{children}</p>
}
function FieldLabel({children}:{children:React.ReactNode}){
  return <p style={{fontSize:15,fontWeight:600,color:"#2a3a60",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 7px"}}>{children}</p>
}
