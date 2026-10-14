import { useParams } from 'react-router'
import { GAME, isArtefactId } from '../content/gameData'

/**
 * What a normal phone camera opens from a printed QR code (spec 10.3). A friendly explanation,
 * never an answer. Responsive rather than on the fixed canvas, since it's read on a phone.
 */
export function PhoneLandingPage() {
  const { artefactId = '' } = useParams()
  const artefact = isArtefactId(artefactId) ? GAME.artefacts[artefactId] : null

  return (
    <main className="phone-landing">
      <div className="phone-landing-card paper">
        <h1 className="display-title display-title--small">{GAME.phoneLanding.title}</h1>
        <p>{GAME.phoneLanding.message}</p>
        {artefact && (
          <p className="phone-landing-artefact">
            {GAME.phoneLanding.cardLabel}: <strong>{artefact.name}</strong>
          </p>
        )}
      </div>
    </main>
  )
}
