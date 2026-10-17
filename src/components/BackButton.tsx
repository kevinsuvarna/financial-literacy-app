import { useLocation, useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { previousScreenPath } from '../app/navigation'
import { SCREENS, type ScreenKey } from '../app/screens'

/**
 * The round back button in the top-left corner, styled like the tracker's step circles. It goes to
 * the screen before this one in the game's order (navigation.ts), never "back one action". Off the
 * main line (the Case Board) it returns to where the player came from, or to `fallback`.
 */
export function BackButton({ fallback }: { fallback?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const key = (Object.keys(SCREENS) as ScreenKey[]).find((k) => SCREENS[k].path === pathname.replace(/\/+$/, '') || (pathname === '/' && k === 'start'))
  const goBack = () => {
    const previous = key ? previousScreenPath(key) : null
    if (previous) return navigate(previous)
    const visited = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
    if (visited) navigate(-1)
    else if (fallback) navigate(fallback)
  }
  return (
    <button type="button" className="back-button" aria-label={GAME.ui.back} onClick={goBack}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12 H6 M11 6 L5 12 L11 18" />
      </svg>
    </button>
  )
}
