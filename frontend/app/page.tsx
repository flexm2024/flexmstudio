// 작업목록 | 작업상세+탭 | 영상미리보기 — 3열 레이아웃
"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  startGenerate, getStatusEventSource, getVideoUrl,
  listJobs, getJobInfo, getJobImageUrl, getJobAudioUrl, triggerRender,
  generateScript, createDraft, runJob, deleteJob,
  JobSummary, JobInfo,
} from "@/lib/api"

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
  assembling:"자막 적용 중", rendering:"렌더링 중", done:"완료", error:"오류",
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
  if(s==="error") return "#ff453a"
  if(s==="awaiting_render") return "#ffd60a"
  if(s==="pending") return "rgba(255,255,255,0.15)"
  return "#0a84ff"
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

  // 탭 + 상세
  const [activeTab,setActiveTab]  = useState("title")
  const [jobInfo,setJobInfo]      = useState<JobInfo|null>(null)
  const [renderLoading,setRenderLoading]= useState(false)

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
    if(!job||job.status==="done"||job.status==="error"){
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
      // 상태에 맞는 탭 자동 전환
      setActiveTab(STATUS_TO_TAB[s]??activeTab)
      if(s==="done"||s==="error"){ es.close(); fetchJobs() }
    }
    es.onerror=()=>es.close()
    return()=>es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedJobId])

  // ── 작업 선택 ────────────────────────────────────────────────────────────

  function selectJob(job:JobSummary){
    setSelectedJobId(job.job_id)
    setView("job")
    setJobInfo(null)
    setStepStatus(job.status)
    setProgress(job.progress)
    setActiveTab(STATUS_TO_TAB[job.status]??"title")
  }

  useEffect(()=>{
    setJobInfo(null)
    if(selectedJobId) getJobInfo(selectedJobId).then(setJobInfo)
  },[selectedJobId])

  // ── 탭 클릭 ──────────────────────────────────────────────────────────────

  async function handleTabClick(key:string){
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

  async function handleRender(){
    if(!selectedJobId) return
    setRenderLoading(true)
    try{ await triggerRender(selectedJobId) }catch{}
    finally{ setRenderLoading(false) }
  }

  // ── 탭 상태 계산 ─────────────────────────────────────────────────────────

  function tabState(step:typeof PIPELINE_STEPS[0]):"done"|"active"|"pending"{
    if(step.key==="title") return "done"
    if(step.key==="done"&&stepStatus==="done") return "done"
    if(step.statuses.includes(stepStatus)) return "active"
    // awaiting_render → 이미지 탭은 active 처리
    if(step.key==="generating_images"&&stepStatus==="awaiting_render") return "active"
    const si=STATUS_ORDER.indexOf(step.statuses[0]??"")
    const ci=STATUS_ORDER.indexOf(stepStatus)
    return si<ci?"done":"pending"
  }

  const selectedJob=jobs.find(j=>j.job_id===selectedJobId)
  const videoUrl=selectedJob?.status==="done"?getVideoUrl(selectedJobId!):null

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return(
    <div style={{height:"100vh",display:"flex",background:"#0f0f11",color:"#f5f5f7",fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif',overflow:"hidden"}}>

      {/* ── 1열: 사이드바 ────────────────────────────────────────────────── */}
      <nav style={{width:240,minWidth:240,background:"rgba(16,16,18,0.98)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* 헤더 + 새 작업 버튼 */}
        <div style={{padding:"16px 14px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(145deg,#0a84ff,#5e5ce6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>✦</div>
          <span style={{fontSize:13,fontWeight:700,flex:1,letterSpacing:"-0.3px"}}>Shorts</span>
          <button
            onClick={()=>{ setView("create"); setTitle(""); setScript(""); setTitleConfirmed(false); setDraftJobId(null); setSubmitError("") }}
            title="새 작업 만들기"
            style={{width:26,height:26,borderRadius:6,background:"rgba(10,132,255,0.18)",border:"1px solid rgba(10,132,255,0.3)",color:"#0a84ff",fontSize:18,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}
          >+</button>
        </div>

        {/* 목록 */}
        <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
          {jobs.length===0&&(
            <p style={{fontSize:12,color:"rgba(255,255,255,0.18)",textAlign:"center",marginTop:24}}>작업 없음</p>
          )}
          {jobs.map(job=>{
            const isSelected=job.job_id===selectedJobId
            const isRunning=!["done","error","pending","awaiting_render"].includes(job.status)
            const isHovered=hoveredJobId===job.job_id
            return(
              <div
                key={job.job_id}
                style={{position:"relative",marginBottom:2}}
                onMouseEnter={()=>setHoveredJobId(job.job_id)}
                onMouseLeave={()=>setHoveredJobId(null)}
              >
                <button
                  onClick={()=>selectJob(job)}
                  style={{width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:isSelected?"rgba(10,132,255,0.14)":"transparent",transition:"background 0.15s",fontFamily:"inherit"}}
                >
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,paddingRight:isHovered?18:0,transition:"padding-right 0.15s"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:dotColor(job.status),flexShrink:0,animation:isRunning?"pulse 1.5s ease-in-out infinite":"none"}}/>
                    <span style={{fontSize:13,fontWeight:500,color:isSelected?"#f5f5f7":"rgba(255,255,255,0.65)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",flex:1}}>
                      {job.title||"제목 없음"}
                    </span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:13}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.22)"}}>{timeAgo(job.created_at)}</span>
                    {isRunning&&(
                      <div style={{flex:1,height:2,background:"rgba(255,255,255,0.08)",borderRadius:1,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${job.progress}%`,background:"#0a84ff",borderRadius:1,transition:"width 1s"}}/>
                      </div>
                    )}
                    {job.status==="awaiting_render"&&<span style={{fontSize:10,color:"#ffd60a",fontWeight:600}}>검수</span>}
                    {job.status==="done"&&<span style={{fontSize:10,color:"#30d158",fontWeight:600}}>완료</span>}
                  </div>
                </button>
                {isHovered&&(
                  <button
                    onClick={(e)=>handleDelete(e,job.job_id)}
                    title="삭제"
                    style={{position:"absolute",top:"50%",right:6,transform:"translateY(-50%)",width:18,height:18,borderRadius:4,background:"rgba(255,69,58,0.2)",border:"none",color:"#ff453a",fontSize:11,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0,padding:0}}
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
        <div style={{flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(16,16,18,0.6)"}}>
          {/* 옵션 툴바 */}
          <div style={{padding:"0 20px",height:44,display:"flex",alignItems:"center",gap:20,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <OptionGroup label="TTS">
              {[["alloy","Alloy"],["echo","Echo"],["nova","Nova"]].map(([v,l])=>(
                <SegBtn key={v} active={voice===v} onClick={()=>setVoice(v)}>{l}</SegBtn>
              ))}
            </OptionGroup>
            <div style={{width:1,height:18,background:"rgba(255,255,255,0.08)"}}/>
            <OptionGroup label="이미지">
              {[["realistic","사실적"],["animation","애니"],["minimal","미니멀"]].map(([v,l])=>(
                <SegBtn key={v} active={imageStyle===v} onClick={()=>setStyle(v)}>{l}</SegBtn>
              ))}
            </OptionGroup>
          </div>

          {/* 파이프라인 탭 — 항상 표시 */}
          <div style={{display:"flex",gap:2,padding:"8px 20px 10px",overflowX:"auto",alignItems:"center"}}>
            {PIPELINE_STEPS.map(step=>{
              const state=tabState(step)
              const isSel=activeTab===step.key&&view==="job"
              const clickable=(state==="done"||state==="active")&&view==="job"
              const bg=isSel?"rgba(255,255,255,0.11)":state==="active"&&view==="job"?"rgba(10,132,255,0.13)":"transparent"
              const color=isSel?"#f5f5f7":state==="done"&&view==="job"?"#0a84ff":state==="active"&&view==="job"?"#e8e8ed":"rgba(255,255,255,0.2)"
              return(
                <button
                  key={step.key}
                  onClick={()=>clickable&&handleTabClick(step.key)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",background:bg,border:"none",borderRadius:20,color,fontSize:12,fontWeight:isSel?600:500,cursor:clickable?"pointer":"default",transition:"background 0.2s,color 0.2s",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:isSel?"0 1px 3px rgba(0,0,0,0.35)":"none",letterSpacing:"-0.1px"}}
                >
                  {state==="done"&&!isSel&&view==="job"&&(
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{flexShrink:0}}>
                      <path d="M1 4.5L3.3 7L8 2" stroke="#0a84ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {state==="active"&&!isSel&&view==="job"&&<div style={{width:5,height:5,borderRadius:"50%",background:"#0a84ff",flexShrink:0,animation:"pulse 1.2s ease-in-out infinite"}}/>}
                  {step.label}
                </button>
              )
            })}

            {/* 실행 버튼 */}
            {(()=>{
              const isCreate=view==="create"&&titleConfirmed&&!submitting
              const isRender=view==="job"&&stepStatus==="awaiting_render"&&!renderLoading
              const isPending=view==="job"&&stepStatus==="pending"&&!submitting
              const active=isCreate||isRender||isPending
              const label=submitting?"스크립트 생성 중…":renderLoading?"렌더 시작 중…":isRender?"렌더 시작":"실행"
              return(
                <button
                  onClick={()=>{ if(isCreate) submitJob(); else if(isRender) handleRender(); else if(isPending) handleRunPending() }}
                  disabled={!active}
                  style={{
                    marginLeft:"auto",flexShrink:0,display:"flex",alignItems:"center",gap:6,
                    padding:"5px 16px",
                    background:active?"linear-gradient(135deg,#1a8eff,#0a6edb)":"rgba(255,255,255,0.05)",
                    border:"none",borderRadius:20,
                    color:active?"#fff":"rgba(255,255,255,0.2)",
                    fontSize:12,fontWeight:700,cursor:active?"pointer":"default",
                    transition:"all 0.2s",fontFamily:"inherit",
                    boxShadow:active?"0 0 12px rgba(10,132,255,0.45),0 2px 6px rgba(0,0,0,0.3)":"none",
                    letterSpacing:"-0.1px",
                  }}
                >
                  {active&&!submitting&&!renderLoading&&(
                    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                      <path d="M0 0L8 5L0 10V0Z"/>
                    </svg>
                  )}
                  {label}
                </button>
              )
            })()}
          </div>

          {/* 선택된 작업 제목 */}
          {view==="job"&&selectedJob&&(
            <div style={{padding:"0 20px 12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:dotColor(stepStatus),flexShrink:0}}/>
              <p style={{fontSize:14,fontWeight:600,margin:0,flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",letterSpacing:"-0.3px"}}>
                {selectedJob.title||"제목 없음"}
              </p>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.28)",flexShrink:0}}>{STATUS_LABEL[stepStatus]??stepStatus}</span>
            </div>
          )}
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
                    <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(10,132,255,0.08)",border:"1px solid rgba(10,132,255,0.25)",borderRadius:11,padding:"11px 14px"}}>
                      <span style={{flex:1,fontSize:14,color:"#f5f5f7",fontWeight:500}}>{title}</span>
                      <button
                        type="button"
                        onClick={()=>setTitleConfirmed(false)}
                        style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px",borderRadius:6,flexShrink:0}}
                      >수정</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:8}}>
                      <input
                        type="text"
                        style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:11,padding:"11px 13px",color:"#f5f5f7",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"}}
                        onFocus={e=>(e.target.style.borderColor="rgba(10,132,255,0.5)")}
                        onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.09)")}
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
                        style={{padding:"11px 18px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:11,color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600,cursor:!title.trim()?"not-allowed":"pointer",opacity:!title.trim()?0.4:1,transition:"all 0.2s",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}
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
                    style={{width:"100%",height:200,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:11,padding:"11px 13px",color:"#f5f5f7",fontSize:14,lineHeight:1.65,resize:"none",boxSizing:"border-box",outline:"none",fontFamily:"inherit",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="rgba(10,132,255,0.5)")}
                    onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.09)")}
                    placeholder="쇼츠로 만들 내용을 입력하거나 AI 작성을 이용하세요..."
                    value={script}
                    onChange={e=>setScript(e.target.value)}
                    required
                  />
                </div>

                {submitError&&<p style={{color:"#ff453a",fontSize:12,margin:0}}>{submitError}</p>}
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
              />
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <p style={{color:"rgba(255,255,255,0.15)",fontSize:14}}>← 작업을 선택하거나 새 작업을 만드세요</p>
          </div>
        )}
      </div>

      {/* ── 3열: 영상 미리보기 ──────────────────────────────────────────── */}
      <aside style={{width:380,minWidth:380,background:"rgba(16,16,18,0.98)",borderLeft:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <p style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.07em",margin:0}}>미리보기</p>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,gap:14}}>
          {videoUrl?(
            <>
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                autoPlay
                style={{width:"100%",aspectRatio:"9/16",borderRadius:16,background:"#000",boxShadow:"0 24px 64px rgba(0,0,0,0.8)",maxHeight:"78vh",objectFit:"contain"}}
              />
              <a
                href={videoUrl}
                download="shorts.mp4"
                style={{width:"100%",padding:"11px",borderRadius:10,textAlign:"center",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,textDecoration:"none",boxSizing:"border-box"}}
              >
                다운로드
              </a>
            </>
          ):(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:36,opacity:0.1,marginBottom:12}}>▶</div>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.15)",margin:0}}>완료된 영상이<br/>여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </aside>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

// ── 탭 내용 ──────────────────────────────────────────────────────────────────

function TabContent({tab,jobId,jobInfo,stepStatus,progress,message,videoUrl,onRender,renderLoading}:{
  tab:string; jobId:string; jobInfo:JobInfo|null
  stepStatus:string; progress:number; message:string
  videoUrl:string|null; onRender:()=>void; renderLoading:boolean
}){

  if(tab==="title") return(
    <div style={{maxWidth:560}}>
      <p style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 12px"}}>원본 스크립트</p>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.8,whiteSpace:"pre-wrap",margin:0}}>
        {jobInfo?.script??<span style={{color:"rgba(255,255,255,0.2)"}}>로딩 중...</span>}
      </p>
    </div>
  )

  if(tab==="parsing") return(
    <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:560}}>
      {jobInfo?.scenes?.map((scene,i)=>(
        <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:700,color:"#0a84ff",background:"rgba(10,132,255,0.15)",padding:"2px 8px",borderRadius:20,flexShrink:0}}>씬 {i+1}</span>
            <p style={{fontSize:14,color:"#f5f5f7",margin:0,lineHeight:1.65}}>{scene.narration}</p>
          </div>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",margin:0,fontStyle:"italic"}}>{scene.image_prompt}</p>
        </div>
      ))??<Gray>스크립트 분석 전입니다.</Gray>}
    </div>
  )

  if(tab==="generating_images") return(
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:660}}>
      {/* 검수 배너 */}
      {stepStatus==="awaiting_render"&&(
        <div style={{background:"rgba(255,214,10,0.08)",border:"1px solid rgba(255,214,10,0.25)",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:"#ffd60a",margin:"0 0 3px"}}>이미지 검수 대기</p>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",margin:0}}>생성된 이미지를 확인한 후 렌더를 시작하세요.</p>
          </div>
          <button
            onClick={onRender}
            disabled={renderLoading}
            style={{padding:"11px 22px",background:"linear-gradient(180deg,#1a8eff,#0a7aee)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",opacity:renderLoading?0.6:1,fontFamily:"inherit",flexShrink:0,letterSpacing:"-0.2px"}}
          >
            {renderLoading?"시작 중...":"렌더 시작 →"}
          </button>
        </div>
      )}
      <ImageGrid jobId={jobId} jobInfo={jobInfo}/>
    </div>
  )

  if(tab==="assembling") return(
    <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:560}}>
      <p style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px"}}>씬별 자막 텍스트</p>
      {jobInfo?.scenes?.map((scene,i)=>(
        <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:11,fontWeight:700,color:"#0a84ff",background:"rgba(10,132,255,0.15)",padding:"2px 8px",borderRadius:20,flexShrink:0,marginTop:2}}>씬 {i+1}</span>
          <p style={{fontSize:15,color:"#f5f5f7",margin:0,lineHeight:1.7,fontWeight:500}}>{scene.narration}</p>
        </div>
      ))??<Gray>자막 정보를 불러오는 중입니다.</Gray>}
    </div>
  )

  if(tab==="generating_audio") return(
    <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:560}}>
      {jobInfo&&jobInfo.audio_count>0
        ?Array.from({length:jobInfo.audio_count}).map((_,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:700,color:"#0a84ff",background:"rgba(10,132,255,0.15)",padding:"2px 8px",borderRadius:20,flexShrink:0}}>씬 {i+1}</span>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",margin:0,lineHeight:1.5}}>{jobInfo.scenes?.[i]?.narration}</p>
            </div>
            <audio controls src={getJobAudioUrl(jobId,i)} style={{width:"100%",height:32}}/>
          </div>
        ))
        :<Gray>음성 생성 전입니다.</Gray>}
    </div>
  )

  if(tab==="rendering") return(
    <div style={{maxWidth:400}}>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",margin:"0 0 16px"}}>{message||"영상을 렌더링 중입니다..."}</p>
      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:3}}>
        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#0a84ff,#5e5ce6)",borderRadius:4,transition:"width 0.8s"}}/>
      </div>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:8}}>{progress}%</p>
    </div>
  )

  if(tab==="done") return(
    <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:480}}>
      {/* 완료 배너 */}
      <div style={{background:"rgba(48,209,88,0.08)",border:"1px solid rgba(48,209,88,0.2)",borderRadius:14,padding:"22px 24px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(48,209,88,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✓</div>
        <div style={{flex:1}}>
          <p style={{fontSize:16,fontWeight:700,color:"#30d158",margin:"0 0 4px"}}>영상 완료!</p>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",margin:0}}>오른쪽 미리보기에서 영상을 확인하고 다운로드하세요.</p>
        </div>
      </div>

      {videoUrl&&(
        <a
          href={videoUrl}
          download="shorts.mp4"
          style={{padding:"14px",background:"linear-gradient(180deg,rgba(48,209,88,0.25),rgba(48,209,88,0.15))",border:"1px solid rgba(48,209,88,0.3)",borderRadius:12,color:"#30d158",fontSize:15,fontWeight:700,textAlign:"center",textDecoration:"none",letterSpacing:"-0.2px"}}
        >
          완료 — 영상 다운로드
        </a>
      )}
    </div>
  )

  // 기타 (진행 중 단계)
  return(
    <div style={{maxWidth:400}}>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",margin:"0 0 16px"}}>{message||"처리 중..."}</p>
      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:3}}>
        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#0a84ff,#5e5ce6)",borderRadius:4,transition:"width 0.8s"}}/>
      </div>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:8}}>{progress}%</p>
    </div>
  )
}

// ── 이미지 그리드 ─────────────────────────────────────────────────────────────

function ImageGrid({jobId,jobInfo}:{jobId:string;jobInfo:JobInfo|null}){
  const [selected,setSelected]=useState<number|null>(null)
  if(!jobInfo||jobInfo.image_count===0) return <Gray>이미지 생성 전입니다.</Gray>
  return(
    <>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {Array.from({length:jobInfo.image_count}).map((_,i)=>(
          <button
            key={i}
            onClick={()=>setSelected(selected===i?null:i)}
            style={{position:"relative",background:"none",border:"none",padding:0,cursor:"pointer",borderRadius:10,overflow:"hidden",outline:selected===i?"2px solid #0a84ff":"2px solid transparent",transition:"outline 0.15s"}}
          >
            <img src={getJobImageUrl(jobId,i)} alt={`씬 ${i+1}`} style={{width:90,aspectRatio:"9/16",objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.65))",padding:"14px 6px 6px",textAlign:"center"}}>
              <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>씬 {i+1}</span>
            </div>
          </button>
        ))}
      </div>
      {selected!==null&&(
        <div style={{display:"flex",gap:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16,alignItems:"flex-start"}}>
          <img src={getJobImageUrl(jobId,selected)} alt="" style={{width:130,aspectRatio:"9/16",objectFit:"cover",borderRadius:8,flexShrink:0}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:12,fontWeight:700,color:"#0a84ff",margin:"0 0 8px"}}>씬 {selected+1}</p>
            <p style={{fontSize:14,color:"#f5f5f7",lineHeight:1.65,margin:"0 0 10px"}}>{jobInfo.scenes?.[selected]?.narration}</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontStyle:"italic",margin:0}}>{jobInfo.scenes?.[selected]?.image_prompt}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ── 공용 ──────────────────────────────────────────────────────────────────────

function OptionGroup({label,children}:{label:string;children:React.ReactNode}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.25)",letterSpacing:"0.06em",textTransform:"uppercase",flexShrink:0}}>{label}</span>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2}}>{children}</div>
    </div>
  )
}
function SegBtn({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){
  return(
    <button
      type="button"
      onClick={onClick}
      style={{padding:"3px 10px",background:active?"rgba(255,255,255,0.13)":"transparent",border:"none",borderRadius:6,color:active?"#f5f5f7":"rgba(255,255,255,0.35)",fontSize:12,fontWeight:active?600:400,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",boxShadow:active?"0 1px 2px rgba(0,0,0,0.3)":"none"}}
    >{children}</button>
  )
}
function Gray({children}:{children:React.ReactNode}){
  return <p style={{fontSize:13,color:"rgba(255,255,255,0.2)",margin:0}}>{children}</p>
}
function FieldLabel({children}:{children:React.ReactNode}){
  return <p style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 7px"}}>{children}</p>
}
