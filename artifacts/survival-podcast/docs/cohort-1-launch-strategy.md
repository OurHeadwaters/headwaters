# Cohort #1 Launch Strategy — Jack Interview on TSP

## 1. Launch Timeline

**Target air date:** October 2026 (early-to-mid fall)

Back-planned from that date:

| Milestone | Target Date |
|---|---|
| Waitlist page live (✅ done) | May 2026 |
| Interview application submitted to Jack's team | Late June 2026 |
| Recording scheduled | Mid-July 2026 |
| Recording complete | Late July 2026 |
| Editing & show notes delivered | Mid-August 2026 |
| Episode in Jack's publish queue | Early September 2026 |
| **Hard deadline: site + payments live (Task #585)** | **September 15, 2026** |
| Episode air date | October 2026 |
| Enrollment window opens (waitlist first, then public) | Episode drop day |
| Enrollment closes | 14 days after episode airs |
| Founding Cohort #1 begins | January 2027 |

---

## 2. Cohort #1 Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Transformation Path | 🌱 Conventional → Regenerative | Broadest appeal for Jack's audience; most TSP content maps here |
| Seat count | **30 founding seats** | Small enough to feel exclusive, large enough to be viable; "founding cohort" language fits |
| Duration | 12 weeks | Standard cohort cadence; enough depth without burnout |
| Session format | Weekly live (60–90 min) + async recordings | Accommodates listeners in multiple time zones |
| **Founding-member price** | **$497** | Accessible entry for an audience that prioritizes value-for-money; low enough to convert on podcast impulse |
| Standard price (post-launch) | **$797** | $300 savings is a strong reason to act during the window |
| Payment plan | 3 × $179 option | Lowers friction for the price-sensitive listener |
| Enrollment close date | 14 days after episode air date | Creates urgency without cutting off stragglers |
| Enrollment opens (waitlist) | Episode drop day, 12-hour head start | Rewards waitlist signups and gives Jack a concrete "go to the link right now" moment |

---

## 3. Expert Council Member for Cohort #1

**Selected expert for Cohort #1: Joel Salatin — Regenerative Farming**

Joel Salatin is the recommended lead for the first cohort. He is listed on the TSP Expert Council and is one of the most recognizable names in regenerative agriculture worldwide — Polyface Farm, _Folks, This Ain't Normal_, _Salad Bar Beef_. He runs a working, commercially successful farm and has decades of teaching through farm tours, workshops, and books.

| Selection criteria | Joel Salatin |
|---|---|
| Runs a working farm/homestead — not theoretical | ✅ Polyface Farm, Swoope VA — grass-fed beef, pastured poultry, pigs |
| Recognized name for Jack's audience | ✅ One of the most cited figures in the TSP / homesteading / regenerative farming world |
| Documented student/client teaching track record | ✅ Farm apprenticeships, Polyface workshops, Shenandoah Valley events |
| Zone fit for the cohort path | ✅ Zone-3 (Homestead / Farm) — direct match for 🌱 Conventional → Regenerative |
| Available for 12 weekly live sessions starting January 2027 | To be confirmed at outreach |

**Runner-up options (if Joel is unavailable):**
1. **Paul Wheaton** — Permaculture & Homesteading (Zones 2–3). Founder of permies.com, large online community, strong teaching presence. Less well-known to a non-permaculture TSP audience but highly respected.
2. **Marjory Wildcraft** — Home Food Production (Zones 2–3). Founder of The Grow Network, prior TSP-adjacent audience, focused on food production from the household level up. Strong fit for listeners newer to the conventional→regenerative transition.

**Next action:** Reach out to Joel's team by late June 2026 — parallel to submitting the interview pitch to Jack. Frame the ask as: "TSP is launching its first-ever expert-led cohort, Jack is announcing it on the show, and we want Joel to lead the first one." Jack's name carries significant weight with anyone in this space.

**Fallback decision rule:** If Joel is booked out, go to Paul Wheaton next, then Marjory Wildcraft. Do not select an expert without confirmed availability before the interview pitch is accepted.

---

## 4. Interview Pitch (Application to Jack's Team)

**Subject line:** TSP Interview Pitch — Launching the First-Ever TSP Transformation Path Cohort

---

Hey [Jack / booking contact],

I'm pitching an episode that I think could be a genuine community moment for TSP listeners: the public launch of the first-ever Transformation Path Cohort.

**The hook:** Instead of quietly posting a course link, we're using the podcast as the launch event. The episode would explain what a TSP cohort is, why this transformation path matters right now, and give listeners a specific, time-limited enrollment window at a founding price that goes away when the seats fill.

**What it is:**
A 12-week, live, expert-led cohort for TSP listeners who are serious about moving from conventional to regenerative living — not just reading about it. Small group (30 seats), weekly live sessions, direct expert access, private community. The expert leading it is **Joel Salatin**, who runs Polyface Farm in Virginia — the most recognized regenerative farming operation in the country and a name your audience already respects.

**Why it's newsworthy:**
- First time TSP has offered a structured group learning program
- Live accountability model — not another course to abandon
- The podcast episode IS the launch event; there's no other marketing campaign
- Founding pricing locks in only during the enrollment window the episode creates

**What the listener CTA looks like:**
Simple: one URL (survivalpodcast.com/cohorts/founding), an enrollment deadline (14 days after the episode airs), and a price that goes from $497 to $797 after the founding seats fill.

**For you:**
This positions TSP as the anchor for a real practitioner-to-community pipeline — not just content, but transformation. It's also a natural fit with the Expert Council directory that's already live on the site.

I can send a full one-pager, connect you with Joel directly, or hop on a quick call. Whatever makes this easiest for your team.

Thanks, Jack — let me know.

---

## 5. On-Air CTA (What Jack Says)

**Primary CTA (say it twice — once mid-episode, once at the end):**

> "If you want in on this, go to **survivalpodcast.com/cohorts/founding** — that's forward slash cohorts, forward slash founding. Get on the waitlist right now. When enrollment opens — and it only opens for two weeks — waitlist members get first access at the founding price, which is $300 less than what it'll cost after the seats fill. Thirty seats. That's it. After that it's closed. **survivalpodcast.com/cohorts/founding.**"

**Shortened for mid-episode mention:**

> "The link is in the show notes — survivalpodcast.com/cohorts/founding. Go grab your seat at the founding price."

**Key elements the CTA always contains:**
- Exact URL (no shortener, easy to remember while driving)
- What they'll find there (enrollment, waitlist if not yet open)
- The deadline (14 days)
- The pricing hook ($300 savings)
- Scarcity (30 seats)

---

## 6. Pre-Launch Waitlist Page

**URL:** `/cohorts/founding`
**Status:** ✅ Built and routed (this task)

**Page contains:**
- Founding Cohort badge + transformation path branding
- Hero headline emphasizing this is the first-ever TSP cohort
- Waitlist email capture form (submits to `POST /api/cohorts/waitlist`)
- Founding vs. standard pricing callout ($497 / $797)
- Seat count (30) and timeline
- What a cohort is (for listeners who are new to the concept)
- TSP connection section (connects the episode to the enrollment)
- Second CTA at bottom of page

**Handoff to Task #585:** When enrollment opens, the form on this page should redirect or convert to the full Stripe checkout flow. The waitlist endpoint logs emails to the API server; Task #585 should migrate these into the real DB table when it builds the cohort DB schema.

---

## 7. Founding Cohort Positioning Copy

### Headline
**"The First-Ever TSP Transformation Path Cohort — 30 Seats, Founding Price"**

### Subheadline
> Work through the 🌱 Conventional → Regenerative transformation alongside 29 other serious students — with a vetted TSP expert leading the way, live, week by week.

### Key Bullets (for cohort landing page, email, and show notes)
- **30 founding seats only.** Once they're gone, this cohort closes and the price goes up for the next one.
- **$497 founding price** — $300 less than what it'll cost after launch. Locked in for life (re-enrollment, future cohorts).
- **12 weeks, live.** Weekly sessions with [Expert Name], not a self-paced course you abandon.
- **Private cohort community.** A small group of people making the same transformation at the same time.
- **Lifetime recordings.** Miss a session? Every call is recorded and yours to keep.
- **Backed by The Survival Podcast.** This cohort exists because Jack believed in it enough to launch it on air.

### Urgency / Deadline Line
> *Enrollment closes [DATE] at midnight. After that, this cohort is full and the founding price is gone.*

---

## 8. Post-Episode Follow-Up Email Sequence

**Sender:** The Stomping Path team (or Jack's list, depending on the relationship)

### Email 1 — Episode drops (Day 0)
- **Trigger:** Episode publishes
- **Sent to:** Waitlist members (12-hour early access) → then general TSP audience
- **Subject:** "Enrollment is open — founding price, 30 seats"
- **Body:** Link to enrollment page, pricing reminder, deadline, one-sentence expert bio

### Email 2 — Urgency (Day 5)
- **Trigger:** 5 days after enrollment opens
- **Sent to:** Waitlist who haven't enrolled, podcast episode listeners who clicked but didn't buy
- **Subject:** "9 days left — [X] of 30 founding seats remain"
- **Body:** Social proof if any (early member quote), seat count update, re-state pricing and deadline

### Email 3 — Final call (Day 12)
- **Trigger:** 48 hours before enrollment closes
- **Sent to:** Same non-converted segment
- **Subject:** "48 hours. [X] seats left. After that, $797."
- **Body:** Short, direct. Deadline. Price going up. Link.

### Email 4 — Closed (Day 14)
- **Trigger:** Enrollment closes
- **Sent to:** Anyone who clicked but didn't enroll
- **Subject:** "Cohort #1 is full — here's what's next"
- **Body:** Waitlist for Cohort #2, link to explore other cohorts / transformation paths on the site

### Who sends it
- Emails 1–3: The Stomping Path team via the email provider connected to the waitlist form
- Email 4: Same; double as a re-engagement for future cohorts

---

*Document created: May 2026 | Task #600 | Cohort launch target: Fall 2026*
