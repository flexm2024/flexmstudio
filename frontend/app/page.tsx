// 작업목록 | 작업상세+탭 | 영상미리보기 — 3열 프리미엄 레이아웃
"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  getStatusEventSource, getVideoUrl,
  listJobs, getJobInfo, triggerRender,
  generateScript, createDraft, runJob, deleteJob, cancelJob,
  JobSummary, JobInfo,
} from "@/lib/api"
import { FieldLabel } from "@/app/components/ui"
import { VoiceCard, VOICES_F, VOICES_M } from "@/app/components/VoiceSelector"
import { StyleCards } from "@/app/components/StyleCards"
import { BgmSelector } from "@/app/components/BgmSelector"
import { TabContent } from "@/app/components/TabContent"

// ── 상수 ─────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "title",             label: "제목",    statuses: [] as string[] },
  { key: "parsing",           label: "스크립트", statuses: ["parsing"] },
  { key: "generating_images", label: "이미지",   statuses: ["generating_images"] },
  { key: "generating_audio",  label: "TTS",     statuses: ["generating_audio"] },
  { key: "assembling",        label: "자막",    statuses: ["assembling"] },
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
  generating_images:"generating_images", generating_audio:"generating_audio",
  awaiting_render:"generating_images", assembling:"assembling",
  rendering:"rendering", done:"done", error:"done",
}

function dotColor(s:string){
  if(s==="done") return "#30d158"
  if(s==="error"||s==="cancelled") return "#ff453a"
  if(s==="awaiting_render") return "#ffd60a"
  if(s==="pending") return "rgba(255,255,255,0.12)"
  return "#6b6aff"
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

// ── 스타일 유틸 ──────────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display:"flex",alignItems:"center",gap:5,fontFamily:"inherit",
  borderRadius:20,border:"none",fontSize:12,fontWeight:700,
  transition:"all 0.2s ease",letterSpacing:"-0.1px",cursor:"pointer",flexShrink:0,
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
  const [bgmStyle,setBgmStyle]   = useState("none")
  const [bgmVolume,setBgmVolume] = useState(0.25)
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
      await runJob(draftJobId,{title,script:finalScript,voice,image_style:imageStyle,bgm_style:bgmStyle,bgm_volume:bgmVolume})
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
      await runJob(selectedJobId,{title:job.title,script:finalScript,voice,image_style:imageStyle,bgm_style:bgmStyle,bgm_volume:bgmVolume})
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
    // awaiting_render → 이미지·자막 탭 모두 active 처리
    if(step.key==="generating_images"&&stepStatus==="awaiting_render") return "active"
    if(step.key==="assembling"&&stepStatus==="awaiting_render") return "active"
    const si=STATUS_ORDER.indexOf(step.statuses[0]??"")
    const ci=STATUS_ORDER.indexOf(stepStatus)
    return si<ci?"done":"pending"
  }

  const selectedJob=jobs.find(j=>j.job_id===selectedJobId)
  const videoUrl=selectedJob?.status==="done"?getVideoUrl(selectedJobId!):null

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return(
    <div style={{height:"100vh",display:"flex",background:"var(--surface-0)",color:"var(--text-primary)",overflow:"hidden",position:"relative",zIndex:1}}>

      {/* ── 1열: 사이드바 (글래스) ───────────────────────────────────────── */}
      <nav style={{
        width:240,minWidth:240,
        background:"rgba(17,17,19,0.75)",
        backdropFilter:"blur(32px)",
        WebkitBackdropFilter:"blur(32px)",
        borderRight:"1px solid var(--border)",
        display:"flex",flexDirection:"column",overflow:"hidden",
      }}>

        {/* 헤더 + 새 작업 버튼 */}
        <div style={{
          padding:"16px 14px 12px",
          borderBottom:"1px solid var(--border)",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <div style={{
            width:26,height:26,borderRadius:7,
            background:"linear-gradient(145deg,#6b6aff,#5e5ce6)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,flexShrink:0,color:"#fff",
            boxShadow:"0 2px 8px rgba(107,106,255,0.3)",
          }}>✦</div>
          <span style={{fontSize:14,fontWeight:700,flex:1,letterSpacing:"-0.3px"}}>Shorts</span>
          <button
            onClick={()=>{ setView("create"); setTitle(""); setScript(""); setTitleConfirmed(false); setDraftJobId(null); setSubmitError("") }}
            title="새 작업 만들기"
            style={{
              width:26,height:26,borderRadius:6,
              background:"var(--accent-soft)",
              border:"1px solid rgba(107,106,255,0.3)",
              color:"var(--accent)",fontSize:18,lineHeight:1,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"inherit",flexShrink:0,transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.background="rgba(107,106,255,0.25)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background="var(--accent-soft)"}}
          >+</button>
        </div>

        {/* 목록 */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
          {jobs.length===0&&(
            <div style={{textAlign:"center",marginTop:32,padding:"0 16px"}}>
              <div style={{
                width:36,height:36,borderRadius:"50%",
                background:"var(--surface-2)",border:"1px solid var(--border)",
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 10px",fontSize:14,color:"var(--text-tertiary)",
              }}>✦</div>
              <p style={{fontSize:12,color:"var(--text-tertiary)",margin:"0 0 4px"}}>작업 없음</p>
              <p style={{fontSize:10,color:"rgba(255,255,255,0.12)",margin:0}}>새 작업을 만들어보세요</p>
            </div>
          )}
          {jobs.map(job=>{
            const isSelected=job.job_id===selectedJobId
            const isRunning=!["done","error","pending","awaiting_render"].includes(job.status)
            const isHovered=hoveredJobId===job.job_id
            const statusColor=job.status==="done"?"#30d158":job.status==="awaiting_render"?"#ffd60a":job.status==="error"?"#ff453a":"#6b6aff"
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
                    width:"100%",textAlign:"left",padding:"11px 12px",
                    borderRadius:"var(--radius-md)",cursor:"pointer",fontFamily:"inherit",
                    background:isSelected?"var(--accent-soft)":"transparent",
                    border:`1px solid ${isSelected?"rgba(107,106,255,0.3)":isHovered?"var(--border-hover)":"var(--border)"}`,
                    transition:"all 0.2s cubic-bezier(0.2,0,0,1)",
                    transform:isHovered?"translateY(-1px)":"none",
                    boxShadow:isHovered?"0 4px 12px rgba(0,0,0,0.3)":"none",
                  }}
                >
                  {/* 제목 행 */}
                  <div style={{
                    display:"flex",alignItems:"center",gap:7,
                    marginBottom:7,
                    paddingRight:isHovered?16:0,transition:"padding-right 0.15s",
                  }}>
                    <div style={{
                      width:7,height:7,borderRadius:"50%",
                      background:dotColor(job.status),flexShrink:0,
                      animation:isRunning?"pulse 1.5s ease-in-out infinite":"none",
                    }}/>
                    <span style={{
                      fontSize:13,fontWeight:600,
                      color:isSelected?"var(--text-primary)":"var(--text-secondary)",
                      overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",
                      flex:1,letterSpacing:"-0.2px",
                    }}>
                      {job.title||"제목 없음"}
                    </span>
                  </div>
                  {/* 상태 + 시간 행 */}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{
                      fontSize:10,fontWeight:600,color:statusColor,
                      background:`${statusColor}18`,padding:"2px 7px",
                      borderRadius:"var(--radius-full)",flexShrink:0,
                    }}>{statusLabel}</span>
                    <span style={{fontSize:11,color:"var(--text-tertiary)",flex:1}}>{timeAgo(job.created_at)}</span>
                    {isRunning&&(
                      <>
                        <div style={{
                          width:40,height:2,
                          background:"rgba(255,255,255,0.06)",borderRadius:1,
                          overflow:"hidden",flexShrink:0,
                        }}>
                          <div style={{
                            height:"100%",width:`${job.progress}%`,
                            background:"var(--accent)",borderRadius:1,transition:"width 1s",
                          }}/>
                        </div>
                        <span style={{fontSize:10,color:"var(--accent)",fontWeight:600,flexShrink:0}}>{job.progress}%</span>
                      </>
                    )}
                  </div>
                </button>
                {isHovered&&(
                  <button
                    onClick={(e)=>handleDelete(e,job.job_id)}
                    title="삭제"
                    style={{
                      position:"absolute",top:8,right:8,
                      width:18,height:18,borderRadius:"var(--radius-sm)",
                      background:"var(--red-soft)",border:"none",
                      color:"var(--red)",fontSize:11,
                      cursor:"pointer",display:"flex",alignItems:"center",
                      justifyContent:"center",fontFamily:"inherit",padding:0,
                    }}
                  >×</button>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── 2열: 작업 상세 / 생성 폼 ────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* 상단 고정 헤더 */}
        <div style={{
          flexShrink:0,
          borderBottom:"1px solid var(--border)",
          background:"rgba(17,17,19,0.55)",
          backdropFilter:"blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          position:"relative",
        }}>
          {/* 하단 글로우 라인 */}
          <div style={{
            position:"absolute",bottom:-1,left:"20%",right:"20%",height:1,
            background:"linear-gradient(90deg,transparent,rgba(107,106,255,0.15),transparent)",
            pointerEvents:"none",
          }}/>

          {/* 선택된 작업 제목 + 진행률 — 탭 위에 표시 */}
          {view==="job"&&selectedJob&&(
            <div style={{padding:"14px 24px 10px",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{
                  width:6,height:6,borderRadius:"50%",
                  background:dotColor(stepStatus),flexShrink:0,
                }}/>
                <p style={{
                  fontSize:14,fontWeight:600,margin:0,flex:1,
                  overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",letterSpacing:"-0.3px",
                }}>
                  {selectedJob.title||"제목 없음"}
                </p>
                <span style={{fontSize:11,color:"var(--text-tertiary)",flexShrink:0}}>{STATUS_LABEL[stepStatus]??stepStatus}</span>
              </div>
              {/* 진행률 바 — 진행 중인 상태만 표시 */}
              {!["done","error","cancelled","pending","awaiting_render"].includes(stepStatus)&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{
                    flex:1,height:3,
                    background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",
                  }}>
                    <div style={{
                      height:"100%",width:`${progress}%`,
                      background:"linear-gradient(90deg,var(--accent),#5e5ce6)",
                      borderRadius:2,transition:"width 0.8s ease",
                    }}/>
                  </div>
                  <span style={{
                    fontSize:11,fontWeight:600,color:"var(--accent)",
                    flexShrink:0,minWidth:30,textAlign:"right",
                  }}>{progress}%</span>
                </div>
              )}
            </div>
          )}

          {/* 파이프라인 탭 — 항상 표시 */}
          <div style={{
            display:"flex",gap:2,padding:"4px 24px 10px",
            overflowX:"auto",alignItems:"center",
          }}>
            {PIPELINE_STEPS.map(step=>{
              const state=tabState(step)
              const isSel=activeTab===step.key&&view==="job"
              const clickable=(state==="done"||state==="active")&&view==="job"
              const bg=isSel?"rgba(255,255,255,0.1)":state==="active"&&view==="job"?"var(--accent-soft)":"transparent"
              const color=isSel?"var(--text-primary)":state==="done"&&view==="job"?"var(--accent)":state==="active"&&view==="job"?"rgba(245,245,247,0.8)":"var(--text-tertiary)"
              return(
                <button
                  key={step.key}
                  onClick={()=>clickable&&handleTabClick(step.key)}
                  style={{
                    display:"flex",alignItems:"center",gap:5,
                    padding:"5px 13px",background:bg,
                    border:isSel?"1px solid rgba(255,255,255,0.1)":"1px solid transparent",
                    borderRadius:20,color,
                    fontSize:12,fontWeight:isSel?600:500,
                    cursor:clickable?"pointer":"default",
                    transition:"all 0.2s ease",
                    fontFamily:"inherit",whiteSpace:"nowrap",
                    boxShadow:isSel?"0 1px 4px rgba(0,0,0,0.3)":"none",
                  }}
                  onMouseEnter={e=>{if(clickable&&!isSel){e.currentTarget.style.background="rgba(255,255,255,0.06)"}}}
                  onMouseLeave={e=>{if(!isSel){e.currentTarget.style.background=bg}}}
                >
                  {state==="done"&&!isSel&&view==="job"&&(
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{flexShrink:0}}>
                      <path d="M1 4.5L3.3 7L8 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {state==="active"&&!isSel&&view==="job"&&<div style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",flexShrink:0,animation:"pulse 1.2s ease-in-out infinite"}}/>}
                  {step.label}
                </button>
              )
            })}

            {/* 취소 버튼 — 파이프라인 진행 중일 때 */}
            {view==="job"&&["parsing","generating_images","generating_audio","assembling","rendering"].includes(stepStatus)&&(
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  ...btnBase,marginLeft:"auto",
                  padding:"5px 14px",
                  background:"var(--red-soft)",
                  border:"1px solid rgba(255,69,58,0.3)",
                  color:"var(--red)",
                  cursor:cancelling?"not-allowed":"pointer",
                  opacity:cancelling?0.5:1,
                }}
                onMouseEnter={e=>{if(!cancelling){e.currentTarget.style.background="rgba(255,69,58,0.22)";e.currentTarget.style.transform="scale(1.03)"}}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--red-soft)";e.currentTarget.style.transform="scale(1)"}}
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
                    ...btnBase,marginLeft:"auto",
                    padding:"5px 14px",
                    background:canRender?"linear-gradient(135deg,#30d158,#25a244)":"rgba(255,255,255,0.05)",
                    color:canRender?"#fff":"rgba(255,255,255,0.18)",
                    cursor:canRender?"pointer":"default",
                    boxShadow:canRender?"0 0 14px rgba(48,209,88,0.35),0 2px 6px rgba(0,0,0,0.3)":"none",
                    transform:"scale(1)",
                    transition:"all 0.2s cubic-bezier(0.2,0,0,1)",
                  }}
                  onMouseEnter={e=>{if(canRender){e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow="0 0 20px rgba(48,209,88,0.5),0 4px 12px rgba(0,0,0,0.4)"}}}
                  onMouseLeave={e=>{if(canRender){e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 0 14px rgba(48,209,88,0.35),0 2px 6px rgba(0,0,0,0.3)"}}}
                  onMouseDown={e=>{if(canRender)e.currentTarget.style.transform="scale(0.97)"}}
                  onMouseUp={e=>{if(canRender)e.currentTarget.style.transform="scale(1.04)"}}
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
                    ...btnBase,marginLeft:view==="job"?"8px":"auto",
                    padding:"5px 16px",
                    background:active?"linear-gradient(135deg,var(--accent),#5e5ce6)":"rgba(255,255,255,0.05)",
                    color:active?"#fff":"rgba(255,255,255,0.2)",
                    cursor:active?"pointer":"default",
                    boxShadow:active?"0 0 16px rgba(107,106,255,0.4),0 2px 6px rgba(0,0,0,0.3)":"none",
                    transform:"scale(1)",
                    transition:"all 0.2s cubic-bezier(0.2,0,0,1)",
                  }}
                  onMouseEnter={e=>{if(active){e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow="0 0 24px rgba(107,106,255,0.55),0 4px 12px rgba(0,0,0,0.4)"}}}
                  onMouseLeave={e=>{if(active){e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 0 16px rgba(107,106,255,0.4),0 2px 6px rgba(0,0,0,0.3)"}}}
                  onMouseDown={e=>{if(active)e.currentTarget.style.transform="scale(0.96)"}}
                  onMouseUp={e=>{if(active)e.currentTarget.style.transform="scale(1.04)"}}
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
            <div style={{width:"100%",maxWidth:520}}>
              <p style={{fontSize:22,fontWeight:700,margin:"0 0 28px",letterSpacing:"-0.5px"}}>새 작업 만들기</p>
              <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:20}}>

                {/* 제목 / 키워드 */}
                <div>
                  <FieldLabel>제목 / 키워드</FieldLabel>
                  {titleConfirmed?(
                    <div style={{
                      display:"flex",alignItems:"center",gap:10,
                      background:"var(--accent-soft)",
                      border:"1px solid rgba(107,106,255,0.25)",
                      borderRadius:"var(--radius-md)",padding:"11px 14px",
                    }}>
                      <span style={{flex:1,fontSize:14,color:"var(--text-primary)",fontWeight:500}}>{title}</span>
                      <button
                        type="button"
                        onClick={()=>setTitleConfirmed(false)}
                        style={{
                          background:"none",border:"none",
                          color:"var(--text-tertiary)",fontSize:12,cursor:"pointer",
                          fontFamily:"inherit",padding:"2px 6px",borderRadius:"var(--radius-sm)",flexShrink:0,
                        }}
                      >수정</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:8}}>
                      <input
                        type="text"
                        style={{
                          flex:1,background:"var(--surface-2)",
                          border:"1px solid var(--border)",borderRadius:"var(--radius-md)",
                          padding:"11px 14px",color:"var(--text-primary)",fontSize:14,
                          outline:"none",boxSizing:"border-box",fontFamily:"inherit",
                          transition:"border-color 0.2s, box-shadow 0.2s",
                          boxShadow:"inset 0 1px 3px rgba(0,0,0,0.2)",
                        }}
                        onFocus={e=>{e.target.style.borderColor="rgba(107,106,255,0.5)";e.target.style.boxShadow="inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(107,106,255,0.08)"}}
                        onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="inset 0 1px 3px rgba(0,0,0,0.2)"}}
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
                        style={{
                          padding:"11px 20px",
                          background:title.trim()?"var(--accent-soft)":"var(--surface-2)",
                          border:"1px solid var(--border-hover)",borderRadius:"var(--radius-md)",
                          color:title.trim()?"var(--accent)":"var(--text-tertiary)",
                          fontSize:13,fontWeight:600,
                          cursor:!title.trim()?"not-allowed":"pointer",
                          opacity:!title.trim()?0.4:1,transition:"all 0.2s",
                          fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,
                        }}
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
                    style={{
                      width:"100%",height:200,
                      background:"var(--surface-2)",
                      border:"1px solid var(--border)",borderRadius:"var(--radius-md)",
                      padding:"11px 14px",color:"var(--text-primary)",fontSize:14,
                      lineHeight:1.65,resize:"none",boxSizing:"border-box",
                      outline:"none",fontFamily:"inherit",transition:"border-color 0.2s, box-shadow 0.2s",
                      boxShadow:"inset 0 1px 3px rgba(0,0,0,0.2)",
                    }}
                    onFocus={e=>{e.target.style.borderColor="rgba(107,106,255,0.5)";e.target.style.boxShadow="inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(107,106,255,0.08)"}}
                    onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="inset 0 1px 3px rgba(0,0,0,0.2)"}}
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
                    <p style={{
                      fontSize:10,fontWeight:600,
                      color:"var(--text-tertiary)",
                      textTransform:"uppercase",letterSpacing:"0.06em",margin:0,
                    }}>여성</p>
                    <div style={{display:"flex",gap:8}}>
                      {VOICES_F.map(({v,l,d})=>(
                        <VoiceCard key={v} voice={v} label={l} desc={d} active={voice===v} onSelect={()=>setVoice(v)}/>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <p style={{
                      fontSize:10,fontWeight:600,
                      color:"var(--text-tertiary)",
                      textTransform:"uppercase",letterSpacing:"0.06em",margin:0,
                    }}>남성</p>
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

                {/* BGM */}
                <div>
                  <FieldLabel>배경 음악</FieldLabel>
                  <BgmSelector bgmStyle={bgmStyle} setBgmStyle={setBgmStyle}/>
                  {bgmStyle !== "none" && (
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
                      <span style={{
                        fontSize:11,color:"var(--text-tertiary)",
                        flexShrink:0,minWidth:50,
                      }}>볼륨 {Math.round(bgmVolume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.05"
                        value={bgmVolume}
                        onChange={e=>setBgmVolume(parseFloat(e.target.value))}
                        style={{flex:1,cursor:"pointer"}}
                      />
                    </div>
                  )}
                </div>

                {submitError&&<p style={{color:"var(--red)",fontSize:12,margin:0}}>{submitError}</p>}
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
            <div style={{textAlign:"center"}}>
              <div style={{
                width:52,height:52,borderRadius:"50%",
                background:"var(--surface-2)",border:"1px solid var(--border)",
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 14px",fontSize:20,color:"var(--text-tertiary)",
              }}>✦</div>
              <p style={{color:"var(--text-tertiary)",fontSize:13,margin:"0 0 4px",letterSpacing:"-0.2px"}}>
                작업을 선택하거나 새로 만드세요
              </p>
              <p style={{color:"rgba(255,255,255,0.1)",fontSize:11,margin:0}}>
                왼쪽 상단 + 버튼으로 시작
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 3열: 영상 미리보기 (글래스) ──────────────────────────────────── */}
      <aside style={{
        width:480,minWidth:480,
        background:"rgba(17,17,19,0.75)",
        backdropFilter:"blur(32px)",
        WebkitBackdropFilter:"blur(32px)",
        borderLeft:"1px solid var(--border)",
        display:"flex",flexDirection:"column",
      }}>
        <div style={{
          padding:"16px 18px 12px",
          borderBottom:"1px solid var(--border)",
        }}>
          <p style={{
            fontSize:11,fontWeight:600,
            color:"var(--text-tertiary)",
            textTransform:"uppercase",letterSpacing:"0.07em",margin:0,
          }}>미리보기</p>
        </div>
        <div style={{
          flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:20,gap:14,
        }}>
          {videoUrl?(
            <>
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                style={{
                  width:"100%",aspectRatio:"9/16",
                  borderRadius:"var(--radius-lg)",background:"#000",
                  boxShadow:"0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
                  maxHeight:"78vh",objectFit:"contain",
                }}
              />
              <a
                href={videoUrl}
                download="shorts.mp4"
                style={{
                  width:"100%",padding:"11px",
                  borderRadius:"var(--radius-md)",textAlign:"center",
                  background:"var(--surface-2)",
                  border:"1px solid var(--border-hover)",
                  color:"var(--text-secondary)",fontSize:13,fontWeight:600,
                  textDecoration:"none",boxSizing:"border-box",
                  transition:"all 0.2s ease",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-3)";e.currentTarget.style.color="var(--text-primary)";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-2)";e.currentTarget.style.color="var(--text-secondary)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
              >
                다운로드
              </a>
            </>
          ):(
            <div style={{textAlign:"center",padding:"0 24px"}}>
              <div style={{
                width:56,height:56,borderRadius:"50%",
                background:"var(--surface-2)",
                border:"1px solid var(--border)",
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 14px",fontSize:20,color:"var(--text-tertiary)",
                opacity:0.5,
              }}>▶</div>
              <p style={{fontSize:13,color:"var(--text-tertiary)",margin:"0 0 4px",letterSpacing:"-0.2px"}}>
                아직 완료된 영상이 없습니다
              </p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.1)",margin:0}}>
                작업이 완료되면 여기서 확인할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </aside>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}


