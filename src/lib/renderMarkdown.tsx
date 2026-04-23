import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: 'var(--c-text)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'color-mix(in srgb, var(--c-accent) 10%, transparent)', padding: '0.1em 0.4em', borderRadius: '4px', color: 'var(--c-accent)' }}>{part.slice(1, -1)}</code>
    return part
  })
}

export function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let keyIdx = 0
  let inCodeBlock = false
  let codeLines: string[] = []

  const flushList = () => {
    if (!listItems.length) return
    elements.push(
      <ul key={`ul-${keyIdx++}`} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ fontSize: '0.95rem', color: 'var(--c-muted)', lineHeight: 1.8, listStyleType: 'none', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <FontAwesomeIcon icon={faAngleRight} style={{ color: 'var(--c-accent)', marginTop: '4px', fontSize: '0.65rem', flexShrink: 0 }} />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  const flushCode = () => {
    if (!codeLines.length) return
    elements.push(
      <pre key={`pre-${keyIdx++}`} style={{ background: 'color-mix(in srgb, var(--c-accent) 6%, var(--c-surface2))', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1rem 1.25rem', overflowX: 'auto', margin: '0.5rem 0 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--c-text)' }}>
        <code>{codeLines.join('\n')}</code>
      </pre>
    )
    codeLines = []
  }

  lines.forEach(line => {
    if (line.startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false }
      else { flushList(); inCodeBlock = true }
      return
    }
    if (inCodeBlock) { codeLines.push(line); return }

    if (line.startsWith('# ')) {
      flushList()
      elements.push(<h2 key={keyIdx++} style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--c-text)', margin: '2.5rem 0 1rem', fontFamily: "'Paperlogy', var(--font-display)", lineHeight: 1.25, letterSpacing: '-0.02em' }}>{line.slice(2)}</h2>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(<h3 key={keyIdx++} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--c-text)', margin: '2rem 0 0.75rem', fontFamily: "'Paperlogy', var(--font-display)", paddingBottom: '0.5rem', borderBottom: '1px solid var(--c-border)' }}>{line.slice(3)}</h3>)
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(<h4 key={keyIdx++} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-accent)', margin: '1.5rem 0 0.5rem', fontFamily: "'Paperlogy', var(--font-display)" }}>{line.slice(4)}</h4>)
    } else if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={keyIdx++} style={{ borderLeft: '3px solid var(--c-accent)', paddingLeft: '1rem', margin: '0 0 1rem', color: 'var(--c-muted)', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.8 }}>
          {renderInline(line.slice(2))}
        </blockquote>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
    } else if (/^\d+\. /.test(line)) {
      listItems.push(line.replace(/^\d+\. /, ''))
    } else if (line.trim() === '') {
      flushList()
      flushCode()
    } else {
      flushList()
      elements.push(<p key={keyIdx++} style={{ fontSize: '0.95rem', color: 'var(--c-muted)', lineHeight: 1.9, margin: '0 0 1rem', fontFamily: "'Paperlogy', var(--font-sans)" }}>{renderInline(line)}</p>)
    }
  })

  flushList()
  flushCode()
  return elements
}
