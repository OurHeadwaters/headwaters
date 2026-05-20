import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_KEY = "privacy-guide-community-name";

const C = {
  terracotta: "#C7613B",
  moss: "#4A6741",
  cream: "#FAF6F0",
  charcoal: "#2E2620",
  terracottaLight: "#F5E8DF",
  mossLight: "#E2EBE1",
  border: "#DDD5C8",
  mutedText: "#7A6E65",
  white: "#FFFFFF",
};

const SECTIONS = [
  { key: "guide", label: "Guide", icon: "book-open" },
  { key: "storage", label: "Storage", icon: "database" },
  { key: "vpn", label: "VPN", icon: "shield" },
  { key: "key", label: "Key", icon: "key" },
  { key: "contact", label: "Questions", icon: "message-circle" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function PrivacyGuideScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topInset = isWeb ? 67 : insets.top;

  const [communityName, setCommunityName] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("guide");
  const scrollRef = useRef<ScrollView>(null);
  const sectionNav = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setCommunityName(val);
    });
  }, []);

  const handleCommunityChange = useCallback((text: string) => {
    setCommunityName(text);
    AsyncStorage.setItem(STORAGE_KEY, text);
  }, []);

  const handleSectionPress = (key: SectionKey) => {
    setActiveSection(key);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const HEADER_HEIGHT = 120;
  const NAV_HEIGHT = 48;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.cream }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Privacy Guide</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {communityName ? communityName : "The Clearing & The Lodge"}
            </Text>
          </View>
          <View style={styles.communityInputWrap}>
            <Feather name="users" size={13} color={C.mutedText} style={{ marginRight: 5 }} />
            <TextInput
              style={styles.communityInput}
              value={communityName}
              onChangeText={handleCommunityChange}
              placeholder="Community name"
              placeholderTextColor={C.mutedText}
              maxLength={40}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Section nav */}
        <ScrollView
          ref={sectionNav}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
          style={styles.navBar}
        >
          {SECTIONS.map((s) => {
            const active = activeSection === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => handleSectionPress(s.key)}
                style={[styles.navPill, active && styles.navPillActive]}
              >
                <Feather
                  name={s.icon as any}
                  size={13}
                  color={active ? C.white : C.mutedText}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeSection === "guide" && <GuideSection />}
        {activeSection === "storage" && <StorageSection />}
        {activeSection === "vpn" && <VPNSection />}
        {activeSection === "key" && <MetaphorKeySection />}
        {activeSection === "contact" && <QuestionsSection />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionCard({
  color,
  label,
  children,
}: {
  color: "terracotta" | "moss";
  label: string;
  children: React.ReactNode;
}) {
  const accent = color === "terracotta" ? C.terracotta : C.moss;
  const bg = color === "terracotta" ? C.terracottaLight : C.mossLight;
  return (
    <View style={[styles.sectionCard, { borderLeftColor: accent, backgroundColor: bg }]}>
      <Text style={[styles.sectionCardLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.sectionCardBody}>{children}</Text>
    </View>
  );
}

function PanelHeading({ label }: { label: string }) {
  return (
    <View style={styles.panelHeadingWrap}>
      <View style={[styles.panelHeadingBar, { backgroundColor: C.moss }]} />
      <Text style={styles.panelHeadingText}>{label}</Text>
    </View>
  );
}

function GuideSection() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Your Digital Handbook</Text>
      <Text style={styles.sectionIntro}>
        Swipe through the tabs above to explore the storage table, VPN guide, metaphor key,
        and contact information. Below is the full handbook text.
      </Text>

      <SectionCard color="terracotta" label="The Clearing">
        The Clearing is your family's private sandbox — a locally-run workspace where children
        compose, draft, and experiment without anything leaving your home network. Notes, voice
        memos, and sketches stay on your device unless you deliberately share them. Think of it
        as a fenced garden: the gate is closed by default, and only you hold the latch.
      </SectionCard>

      <SectionCard color="moss" label="The Lodge">
        The Lodge is your community's shared meeting hall — a Saltbox instance hosted by your
        co-op coordinator. Families post announcements, share curriculum links, and hold
        threaded discussions here. Everything posted in The Lodge is visible to all enrolled
        families and stored on the coordinator's server. Post here as you would on a community
        bulletin board: thoughtfully, and without sensitive personal details.
      </SectionCard>

      <SectionCard color="moss" label="The key on the hook">
        Every family receives one login per household, protected by a passphrase chosen at
        enrollment. Your passphrase is never stored in plain text. Do not share it with other
        families — if a child needs separate access, ask the coordinator to create a junior
        account. Rotate your passphrase once per school year or immediately if you suspect it
        has been seen by someone outside your household.
      </SectionCard>

      <SectionCard color="moss" label="The mailbox">
        Direct messages sent through The Lodge travel encrypted in transit but are stored on
        the coordinator's server in readable form for moderation. Do not use Lodge messages for
        sensitive matters: medical details, financial arrangements, or disciplinary
        conversations belong in a separate end-to-end encrypted channel such as Signal. The
        Lodge mailbox is for logistics — field trips, book orders, scheduling.
      </SectionCard>

      <SectionCard color="moss" label="Three simple habits">
        {`Lock before you leave. Enable your device's auto-lock after two minutes of inactivity so The Clearing is never open on an unattended screen.\n\nOne task, one tab. Close The Lodge session when you step away from community work; a stray open tab can expose your session token.\n\nUpdates are not optional. When The Clearing or Lodge app prompts for an update, apply it within 48 hours — security patches are the fastest fix for known risks.`}
      </SectionCard>

      <SectionCard color="terracotta" label="Zone identity">
        {`Treat The Clearing as Zone 0 — intimate, personal, and fully under your control. Treat The Lodge as Zone 2 — shared with trusted neighbours but open to the whole co-op.\n\nNever place Zone 0 material (personal journals, health notes, financial records) into a Zone 2 space. When in doubt, ask yourself: "Would I pin this to the co-op noticeboard?" If the answer is no, keep it in The Clearing.`}
      </SectionCard>

      <SectionCard color="moss" label="The covered wagon route">
        A VPN (Virtual Private Network) encrypts the road between your device and the internet,
        hiding your family's browsing from your internet provider and from coffee-shop networks.
        A VPN does not make you anonymous — the VPN provider still sees your traffic — but it
        does prevent casual surveillance. See the VPN tab for four vetted providers suitable
        for family use.
      </SectionCard>

      <SectionCard color="moss" label="The Canadian legal landscape">
        {`Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) gives you the right to know what data an organization holds about you and to request its correction or deletion. Quebec's Law 25 strengthens these rights for residents of that province.\n\nIf your co-op collects enrolment data, the coordinator must have a written privacy policy, obtain meaningful consent, and delete records when no longer needed. You may file a complaint with the Office of the Privacy Commissioner of Canada at priv.gc.ca at no cost.`}
      </SectionCard>
    </View>
  );
}

function StorageSection() {
  const rows = [
    { label: "Notes & drafts", clearing: "Your device", lodge: "No", cloud: "No" },
    { label: "Posts & replies", clearing: "No", lodge: "Co-op server", cloud: "No" },
    { label: "Direct messages", clearing: "No", lodge: "Co-op server", cloud: "No" },
    { label: "Enrolment info", clearing: "No", lodge: "Co-op server", cloud: "No" },
    { label: "Curriculum files", clearing: "Your device", lodge: "Optional", cloud: "No" },
  ];

  return (
    <View>
      <PanelHeading label="What's stored where" />
      <Text style={styles.panelNote}>
        Understanding where your family's data lives.
      </Text>

      {/* Header row */}
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Text style={[styles.tableCell, styles.tableLabelCell, styles.tableHeaderText]} />
        <Text style={[styles.tableCell, styles.tableHeaderText, { color: C.terracotta }]}>
          Clearing
        </Text>
        <Text style={[styles.tableCell, styles.tableHeaderText, { color: C.moss }]}>
          Lodge
        </Text>
        <Text style={[styles.tableCell, styles.tableHeaderText, { color: C.charcoal }]}>
          Cloud
        </Text>
      </View>

      {rows.map((row, i) => (
        <View key={row.label} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
          <Text style={[styles.tableCell, styles.tableLabelCell, styles.tableLabelText]}>
            {row.label}
          </Text>
          <Text style={[styles.tableCell, getCellStyle(row.clearing)]}>{row.clearing}</Text>
          <Text style={[styles.tableCell, getCellStyle(row.lodge)]}>{row.lodge}</Text>
          <Text style={[styles.tableCell, getCellStyle(row.cloud)]}>{row.cloud}</Text>
        </View>
      ))}

      <View style={styles.legendWrap}>
        <LegendItem color={C.terracotta} label="The Clearing — your private device storage" />
        <LegendItem color={C.moss} label="The Lodge — co-op coordinator's server" />
        <LegendItem color={C.mutedText} label="Cloud — third-party cloud storage" />
      </View>
    </View>
  );
}

function getCellStyle(value: string): object {
  if (value === "No") return styles.cellNo;
  if (value === "Optional") return styles.cellOptional;
  return styles.cellYes;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function VPNSection() {
  const providers = [
    { name: "Mullvad", audit: "Yes", jurisdiction: "Sweden", family: "5 devices", good: true },
    { name: "ProtonVPN", audit: "Yes", jurisdiction: "Switzerland", family: "10 devices", good: true },
    { name: "IVPN", audit: "Yes", jurisdiction: "Gibraltar", family: "7 devices", good: false },
    { name: "Windscribe", audit: "Partial", jurisdiction: "Canada", family: "Unlimited", good: false },
  ];

  return (
    <View>
      <PanelHeading label="VPN Provider Comparison" />
      <Text style={styles.panelNote}>
        Choose a provider with a published no-log audit and a jurisdiction outside the Five Eyes
        intelligence alliance.
      </Text>

      {providers.map((p) => (
        <View key={p.name} style={[styles.vpnCard, p.good && styles.vpnCardHighlighted]}>
          <View style={styles.vpnCardHeader}>
            <Text style={styles.vpnName}>{p.name}</Text>
            {p.good && (
              <View style={styles.vpnBadge}>
                <Feather name="check-circle" size={12} color={C.moss} />
                <Text style={styles.vpnBadgeText}>Audited</Text>
              </View>
            )}
          </View>
          <View style={styles.vpnRow}>
            <VPNStat label="No-log audit" value={p.audit} highlight={p.audit === "Yes"} />
            <VPNStat label="Jurisdiction" value={p.jurisdiction} />
            <VPNStat label="Family plan" value={p.family} />
          </View>
        </View>
      ))}

      <View style={styles.noteCard}>
        <Feather name="info" size={14} color={C.moss} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={styles.noteCardText}>
          Shaded rows have independently audited no-log policies. Prefer providers outside
          the Five Eyes (US, UK, Canada, Australia, New Zealand).
        </Text>
      </View>
    </View>
  );
}

function VPNStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.vpnStat}>
      <Text style={styles.vpnStatLabel}>{label}</Text>
      <Text style={[styles.vpnStatValue, highlight && { color: C.moss, fontWeight: "600" }]}>
        {value}
      </Text>
    </View>
  );
}

function MetaphorKeySection() {
  const terms = [
    { term: "The Clearing", def: "Your private Sandbox workspace" },
    { term: "The Lodge", def: "Your co-op Saltbox instance" },
    { term: "Zone 0", def: "Intimate, device-only space" },
    { term: "Zone 2", def: "Shared with trusted co-op families" },
    { term: "Covered wagon", def: "A VPN tunnel" },
    { term: "Key on the hook", def: "Your household passphrase" },
  ];

  return (
    <View>
      <PanelHeading label="Metaphor Key" />
      <Text style={styles.panelNote}>
        The guide uses everyday metaphors to make digital privacy concepts easy to remember.
      </Text>

      {terms.map((t, i) => (
        <View key={t.term} style={[styles.metaphorRow, i < terms.length - 1 && styles.metaphorBorder]}>
          <View style={styles.metaphorLeft}>
            <View style={[styles.metaphorDot, { backgroundColor: i % 2 === 0 ? C.terracotta : C.moss }]} />
            <Text style={styles.metaphorTerm}>{t.term}</Text>
          </View>
          <Text style={styles.metaphorDef}>{t.def}</Text>
        </View>
      ))}
    </View>
  );
}

function QuestionsSection() {
  return (
    <View>
      <PanelHeading label="Questions?" />
      <Text style={styles.panelNote}>
        Your co-op coordinator is your first point of contact for privacy questions.
      </Text>

      <View style={styles.contactCard}>
        <View style={styles.contactIconWrap}>
          <Feather name="users" size={28} color={C.moss} />
        </View>
        <Text style={styles.contactTitle}>Co-op Privacy Steward</Text>
        <Text style={styles.contactBody}>
          Bring concerns to your co-op privacy steward at the next gathering, or send a Signal
          message to the coordinator.
        </Text>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactIconWrap}>
          <Feather name="flag" size={28} color={C.terracotta} />
        </View>
        <Text style={styles.contactTitle}>Office of the Privacy Commissioner of Canada</Text>
        <Text style={styles.contactBody}>For escalations and formal complaints:</Text>
        <View style={styles.contactDetail}>
          <Feather name="globe" size={14} color={C.moss} />
          <Text style={styles.contactDetailText}>priv.gc.ca</Text>
        </View>
        <View style={styles.contactDetail}>
          <Feather name="phone" size={14} color={C.moss} />
          <Text style={styles.contactDetailText}>1-800-282-1376</Text>
        </View>
      </View>

      <View style={styles.footerDisclaimer}>
        <Text style={styles.footerDisclaimerText}>
          This guide provides general privacy information for homeschool families and does not
          constitute legal advice. Consult a qualified privacy professional for advice specific
          to your situation.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 16,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    color: C.cream,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.terracotta,
    marginTop: 1,
  },
  communityInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 12,
    minWidth: 140,
    maxWidth: 160,
  },
  communityInput: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.cream,
    flex: 1,
    padding: 0,
  },
  navBar: {
    marginBottom: 0,
  },
  navContent: {
    paddingVertical: 10,
    paddingRight: 8,
    gap: 6,
    flexDirection: "row",
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 6,
  },
  navPillActive: {
    backgroundColor: C.moss,
  },
  navLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  navLabelActive: {
    color: C.white,
    fontFamily: "DMSans_600SemiBold",
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    color: C.charcoal,
    marginBottom: 6,
  },
  sectionIntro: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: C.mutedText,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionCard: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  sectionCardLabel: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 14,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  sectionCardBody: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: C.charcoal,
    lineHeight: 21,
  },
  panelHeadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  panelHeadingBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    marginRight: 10,
  },
  panelHeadingText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: C.charcoal,
  },
  panelNote: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.mutedText,
    lineHeight: 19,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeaderRow: {
    marginBottom: 2,
  },
  tableRowAlt: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: C.charcoal,
    textAlign: "center",
  },
  tableLabelCell: {
    flex: 1.6,
    textAlign: "left",
    paddingLeft: 8,
  },
  tableHeaderText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: C.charcoal,
  },
  tableLabelText: {
    fontFamily: "DMSans_500Medium",
    color: C.charcoal,
  },
  cellYes: {
    color: C.moss,
    fontFamily: "DMSans_500Medium",
  },
  cellNo: {
    color: C.mutedText,
  },
  cellOptional: {
    color: C.terracotta,
    fontFamily: "DMSans_500Medium",
  },
  legendWrap: {
    marginTop: 14,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.mutedText,
  },
  vpnCard: {
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  vpnCardHighlighted: {
    borderColor: C.moss,
    backgroundColor: C.mossLight,
  },
  vpnCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  vpnName: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 17,
    color: C.charcoal,
  },
  vpnBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74,103,65,0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  vpnBadgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: C.moss,
  },
  vpnRow: {
    flexDirection: "row",
    gap: 8,
  },
  vpnStat: {
    flex: 1,
  },
  vpnStatLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: C.mutedText,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  vpnStatValue: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: C.charcoal,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.mossLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.moss,
  },
  noteCardText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.charcoal,
    lineHeight: 19,
    flex: 1,
  },
  metaphorRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaphorBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  metaphorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  metaphorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  metaphorTerm: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 15,
    color: C.charcoal,
  },
  metaphorDef: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.mutedText,
    flex: 1,
    textAlign: "right",
  },
  contactCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  contactIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.mossLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  contactTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
    color: C.charcoal,
    textAlign: "center",
    marginBottom: 6,
  },
  contactBody: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.mutedText,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 10,
  },
  contactDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  contactDetailText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: C.moss,
  },
  footerDisclaimer: {
    marginTop: 8,
    padding: 14,
    backgroundColor: C.terracottaLight,
    borderRadius: 8,
  },
  footerDisclaimerText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.mutedText,
    lineHeight: 18,
    textAlign: "center",
  },
});
