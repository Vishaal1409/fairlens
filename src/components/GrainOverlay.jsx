/*
 * A full-viewport decorative film-grain overlay + top vignette.
 * Pure CSS/SVG, no motion — renders once and gets out of the way.
 */
export default function GrainOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        className="grain pointer-events-none fixed inset-0 z-[60]"
        style={{ opacity: 0.22 }}
      />
      <div
        aria-hidden="true"
        className="vignette pointer-events-none fixed inset-0 z-[55]"
      />
    </>
  )
}
