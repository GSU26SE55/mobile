import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/lib/theme";
import { useIncident } from "@/src/features/incidents/hooks/useIncident";
import {
  INCIDENT_TYPE_LABEL,
  INCIDENT_STATUS_LABEL,
} from "@/src/features/incidents/types/incident.types";
import { EnvironmentalIncidentStatusEnum } from "@/src/features/incidents/enums/incident.enum";

/**
 * Firmware writes the reading as `"<sensor> raw=<measured> > thr=<limit> (<pin>)"`. Pulling the
 * two numbers out lets the card show a breach the way a battery ticket does — measured value
 * against the limit it crossed — instead of leaving the reader to find it inside a sentence.
 *
 * Returns null on anything that doesn't match, and the caller prints the text as-is. That matters:
 * `notes` is free-form (case 22 sends just `"water leak GPIO2"`, no numbers at all), so a parser
 * that guessed would invent a threshold the system never checked.
 */
function parseSensorReading(
  notes: string,
): { sensor: string; measured: string; limit: string } | null {
  const m = notes.match(/^(.+?)\s+raw=([\d.]+)\s*>\s*thr=([\d.]+)/i);
  if (!m) return null;
  return { sensor: m[1].trim(), measured: m[2], limit: m[3] };
}

/** Badge colour per incident status — mirrors the web `INCIDENT_STATUS_TONE` map
 *  (Open→p2/warning, Acknowledged→info, Resolved→ok/success, FalseAlarm→muted).
 *  Colouring by status rather than by severity is deliberate: every incident that
 *  reaches a ticket is Critical, so a severity-driven badge would be red on all of
 *  them and carry no signal. */
const STATUS_STYLE: Record<
  EnvironmentalIncidentStatusEnum,
  { bg: string; text: string }
> = {
  [EnvironmentalIncidentStatusEnum.Open]: {
    bg: Colors.warningLight,
    text: Colors.warningDark,
  },
  [EnvironmentalIncidentStatusEnum.Acknowledged]: {
    bg: Colors.infoLight,
    text: Colors.infoDark,
  },
  [EnvironmentalIncidentStatusEnum.Resolved]: {
    bg: Colors.successLight,
    text: Colors.successDark,
  },
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: {
    bg: Colors.card2,
    text: Colors.textMute,
  },
};

interface Props {
  incidentId: string;
  /** Ticket description — fallback evidence when the incident record can't be fetched. */
  description?: string | null;
}

/**
 * Replaces the battery card on a site-level ticket.
 *
 * Those tickets carry an empty `batteryAssetId` because the fault is in the cabinet, not in one
 * battery — so the battery card rendered "No device linked / Ticket not linked to a specific
 * battery", which reads as missing data rather than *not applicable*. The evidence existed all
 * along in the incident's `notes` ("MQ-2 raw=3100 > thr=2000"); this card promotes it.
 */
export default function EnvironmentalIncidentCard({
  incidentId,
  description,
}: Props) {
  const { data: incident, isLoading } = useIncident(incidentId);

  // Prefer the incident's own `notes` over the ticket description: the description is an
  // auto-generated sentence that wraps the reading in boilerplate and raw enum codes
  // ("type 3, severity 3") and is already shown elsewhere on the screen.
  const evidence = incident?.notes?.trim() || description?.trim() || null;
  const reading = evidence ? parseSensorReading(evidence) : null;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="warning" size={18} color={Colors.danger} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {incident
              ? (INCIDENT_TYPE_LABEL[incident.incidentType] ??
                "Environmental incident")
              : "Environmental incident"}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {isLoading
              ? "Loading incident..."
              : "Site-level — no battery attached"}
          </Text>
        </View>
        {incident && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: (
                  STATUS_STYLE[incident.status] ??
                  STATUS_STYLE[EnvironmentalIncidentStatusEnum.Open]
                ).bg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: (
                    STATUS_STYLE[incident.status] ??
                    STATUS_STYLE[EnvironmentalIncidentStatusEnum.Open]
                  ).text,
                },
              ]}
            >
              {INCIDENT_STATUS_LABEL[incident.status] ?? "Open"}
            </Text>
          </View>
        )}
      </View>

      {evidence && (
        <View style={styles.evidenceWrap}>
          <Text style={styles.evidenceLabel}>SENSOR EVIDENCE</Text>
          {reading ? (
            <View style={styles.breachBox}>
              <View style={styles.breachRow}>
                <Text style={styles.breachSensor} numberOfLines={1}>
                  {reading.sensor}
                </Text>
                <Text style={styles.breachValue}>
                  <Text style={styles.breachMeasured}>{reading.measured}</Text>
                  <Text
                    style={styles.breachLimit}
                  >{` > ${reading.limit}`}</Text>
                </Text>
              </View>
              <Text style={styles.breachNote}>
                {`Measured ${reading.measured} against a limit of ${reading.limit} — over threshold.`}
              </Text>
            </View>
          ) : (
            // Unparsed readings still carry the fault; showing the raw line beats hiding it.
            <Text style={styles.rawEvidence}>{evidence}</Text>
          )}
          <Text style={styles.footNote}>
            The fault is in the cabinet, not in one battery, so there is no
            battery reading log to cross-check.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center" },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: Colors.dangerLight,
  },
  headerInfo: { flex: 1 },
  title: { fontSize: 13, fontWeight: "800", color: Colors.text },
  sub: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 3,
    fontWeight: "600",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800" },

  evidenceWrap: { marginTop: 14 },
  evidenceLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMute,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  breachBox: {
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    backgroundColor: "rgba(255,59,48,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  breachRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  breachSensor: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: "600",
    flexShrink: 1,
  },
  breachValue: { fontSize: 12 },
  breachMeasured: { fontWeight: "800", color: Colors.danger },
  breachLimit: { color: Colors.textMute },
  breachNote: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 6,
    fontWeight: "500",
  },
  rawEvidence: {
    fontSize: 11,
    color: Colors.text,
    backgroundColor: Colors.card2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footNote: {
    fontSize: 11,
    color: Colors.textMute,
    marginTop: 6,
    fontWeight: "500",
  },
});
