export default function SatelliteDroneSection() {
  return (
    <section id="satellite-drone" className="trail-section">
      <div className="section-signpost">
        <span className="signpost-emoji" aria-hidden="true">🛰️</span>
        <h2 className="signpost-title">The Satellite &amp; Drone Answer</h2>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">The honest picture from above</h3>
        <p className="journal-section-body">
          Parents ask this question directly: do my children need to be clothed on our own land to
          stay safe from cameras above? The honest answer is no — not because of satellites.
          Satellite imagery of rural Northern Ontario does not resolve body detail. Typical
          consumer-accessible resolution for rural areas (Google Maps, Google Earth) is one to two
          metres per pixel. A person appears as a pixel cluster, not an identifiable body. Google's
          rural Ontario imagery is often years out of date and lower resolution still.
        </p>
        <p className="journal-section-body">
          The highest-resolution commercial satellites available — Maxar WorldView-3 at 30 cm per
          pixel — are not consumer-accessible, cost thousands of dollars per image, require advance
          tasking, and are subject to licensing restrictions. Even at 30 cm, body detail is not
          resolved. Skin tone, posture, and identity are not legible. The orbital geometry changes
          every pass. Rural Ontario appears in commercial catalogues infrequently, and the images
          are rarely current.
        </p>
        <div className="tip-callout">
          <span className="tip-quill" aria-hidden="true">✍</span>
          <p>The satellite threat is not zero — it is negligible for rural Northern Ontario families
          doing normal things on their own land. The real aerial risk is different.</p>
        </div>
      </div>

      <div className="journal-grid journal-grid-2">
        <div className="journal-card">
          <h3 className="journal-section-title">The real risk: drones</h3>
          <p className="journal-section-body">
            A drone close enough to capture identifiable detail is close — within 10 to 30 metres.
            Transport Canada's basic operations rules require recreational and commercial drone
            operators to stay 30 metres from bystanders not involved in the flight. On private
            property, a drone that close is not a passive observer — it is a trespasser. It is
            violating Transport Canada rules and almost certainly Ontario's provincial privacy
            protections as well.
          </p>
          <p className="journal-section-body">
            This matters because the law is already on your side before you do anything. You do
            not need to modify your family's outdoor life to defend against legal aerial activity.
            The aerial activity that could harm you is already illegal.
          </p>
        </div>

        <div className="journal-card">
          <h3 className="journal-section-title">The one countermeasure that works</h3>
          <p className="journal-section-body">
            If you want physical protection against drone observation — not because you are
            legally required to, but because it gives you peace of mind — tree canopy over play
            areas is the single most effective measure. It works against drones, it works against
            any future technology, it grows in value over time, and it improves the land
            regardless. This is the same answer that California natural-parenting and homestead
            guides have given for years.
          </p>
          <p className="journal-section-body">
            Plant canopy where children play. Everything below the canopy is invisible from above,
            from any altitude, with any camera.
          </p>
        </div>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">Transport Canada — what the rules actually say</h3>
        <div className="sd-rule-grid">
          <div className="sd-rule-item">
            <span className="sd-rule-label">Basic Operations</span>
            <span className="sd-rule-body">
              Drone operators under basic rules must stay 30 m horizontally from bystanders not
              involved in the flight. A drone hovering near your children on your property fails
              this standard.
            </span>
          </div>
          <div className="sd-rule-item">
            <span className="sd-rule-label">Advanced Operations</span>
            <span className="sd-rule-body">
              Even operators with advanced certification cannot fly over uninvolved people without
              specific permissions. Residential and rural overflight of people requires
              manufacturer-certified safety documentation.
            </span>
          </div>
          <div className="sd-rule-item">
            <span className="sd-rule-label">Private Property</span>
            <span className="sd-rule-body">
              Ontario's privacy law and common law trespass principles apply to persistent
              aerial surveillance. If a drone is loitering at low altitude over your land, you
              have standing to report it. Document: time, direction of approach, any markings,
              and where it went when it left.
            </span>
          </div>
          <div className="sd-rule-item">
            <span className="sd-rule-label">If it happens</span>
            <span className="sd-rule-body">
              Report to Transport Canada at tc.gc.ca/aviation. File with local OPP or municipal
              police for the privacy/trespass angle. Document everything before reporting — a
              clear record strengthens your position considerably.
            </span>
          </div>
        </div>
        <div className="tip-callout" style={{ marginTop: "1.25rem" }}>
          <span className="tip-quill" aria-hidden="true">✍</span>
          <p>Short answer for the kitchen table: satellites are not the concern. A neighbour
          with a consumer drone at low altitude is the concern, and the law already covers it.
          Plant trees. Document anything unusual. Report if it persists.</p>
        </div>
      </div>
    </section>
  );
}
