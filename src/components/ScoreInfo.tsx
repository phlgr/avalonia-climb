import { Link } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { scoreFactorLabel, scoreOverrideRule, scoreOverrideText } from '../i18n'
import type { Breakdown } from '../lib/scoring'
import { m } from '../paraglide/messages.js'

/**
 * A little "?" trigger that, on hover or click/tap, opens a popover breaking the
 * score down into its four weighted factors (and noting any hard-red override).
 * Used next to the score on the Now hero and on each forecast day row.
 */
export function ScoreInfo({
  breakdown,
  align = 'end',
}: {
  breakdown: Breakdown
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  // Close on outside click / tap and on Escape, but only while open.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover is a non-essential convenience; the inner button is the real keyboard-accessible control
    <span
      ref={wrapRef}
      className="scoreinfo"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="scoreinfo-trigger"
        aria-label={m.score_explain()}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <div id={panelId} role="dialog" className={`scoreinfo-pop scoreinfo-pop--${align}`}>
          {breakdown.override ? (
            <>
              <p className="scoreinfo-title">{m.score_forced_title()}</p>
              <div className="scoreinfo-forced">
                <p className="scoreinfo-forced-reason">{scoreOverrideText(breakdown.override)}</p>
                <p className="scoreinfo-forced-rule">{scoreOverrideRule(breakdown.override)}</p>
              </div>
              <p className="scoreinfo-intro">{m.score_blend_overridden()}</p>
            </>
          ) : (
            <>
              <p className="scoreinfo-title">{m.score_how_title()}</p>
              <p className="scoreinfo-intro">{m.score_blend_intro()}</p>
            </>
          )}
          <ul className={`scoreinfo-parts${breakdown.override ? ' scoreinfo-parts--muted' : ''}`}>
            {breakdown.parts.map((part) => (
              <li key={part.factor}>
                <span className="sb-name">{scoreFactorLabel(part.factor)}</span>
                <span className="sb-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round(part.sub * 100)}%` }} />
                </span>
                <span className="sb-weight">{Math.round(part.weight * 100)}%</span>
                <span className="sb-points">+{part.points}</span>
              </li>
            ))}
          </ul>
          <div className={`scoreinfo-total${breakdown.override ? ' scoreinfo-total--muted' : ''}`}>
            <span>{breakdown.override ? m.score_total_overridden() : m.score_total()}</span>
            <span>
              {breakdown.blend}
              <small>/100</small>
            </span>
          </div>
          <Link to="/method" className="scoreinfo-more">
            {m.score_more()}
          </Link>
        </div>
      )}
    </span>
  )
}
