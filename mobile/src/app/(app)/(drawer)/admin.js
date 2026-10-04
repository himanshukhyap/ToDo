import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  CheckCircle2, CheckSquare, Clock3, Database, Download, Mail,
  Save, Settings2, Shield, Upload, Users,
} from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useDialogs } from "../../../context/DialogContext";
import { useTasks } from "../../../hooks/useTasks";
import { useNotes } from "../../../hooks/useNotes";
import { useNotebooks } from "../../../hooks/useNotebook";
import { BACKUP_SECTIONS, exportUserBackup, importUserBackupWithOptions } from "../../../services/backupService";
import { Btn, Checkbox, Input } from "../../../components/ui";

function formatLastSeen(timestamp) {
  if (!timestamp) return "Waiting for activity";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 5) return "Active now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return `${Math.floor(diffMinutes / 60)}h ago`;
}

function Card({ icon, title, children }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        {icon}
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullets({ items }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4, marginTop: 4 }}>
      {items.map((t) => (
        <Text key={t} style={{ color: colors.text2, fontSize: 12.5, lineHeight: 18 }}>• {t}</Text>
      ))}
    </View>
  );
}

export default function AdminPanel() {
  const { colors } = useTheme();
  const { errorAlert, toast } = useDialogs();
  const {
    user, isAdmin, adminEmails, lastActivityAt, sessionTimeoutMinutes,
    settingsLoading, saveAdminSettings,
  } = useAuth();
  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { notebooks } = useNotebooks();
  const [activeSection, setActiveSection] = useState("backup");
  const [sessionInput, setSessionInput] = useState(String(sessionTimeoutMinutes));
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const allCollections = BACKUP_SECTIONS.map((s) => s.collection);
  const [exportSel, setExportSel] = useState(allCollections);
  const [importSel, setImportSel] = useState(allCollections);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const totalItems = tasks.length + notes.length + notebooks.length;

  useEffect(() => { setSessionInput(String(sessionTimeoutMinutes)); }, [sessionTimeoutMinutes]);

  if (!isAdmin) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>RESTRICTED AREA</Text>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 6 }}>Admin access required</Text>
        <Text style={{ color: colors.text2, marginTop: 6 }}>This panel is only available to approved admin email IDs.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    const minutes = Number(sessionInput);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      errorAlert("Session timeout 1 se 240 minutes ke beech hona chahiye.");
      return;
    }
    setSaving(true);
    try {
      await saveAdminSettings({ sessionTimeoutMinutes: minutes });
      toast("success", "Session settings saved");
    } catch (e) {
      errorAlert(e.message || "Settings save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupExport = async () => {
    if (!exportSel.length) {
      errorAlert("Backup ke liye kam se kam ek section select karein.");
      return;
    }
    setBackupBusy(true);
    try {
      const summary = await exportUserBackup(user, { selectedCollections: exportSel });
      toast("success", `Backup ready: ${summary.tasks} tasks, ${summary.notes} notes, ${summary.notebooks} notebooks`);
    } catch (e) {
      errorAlert(e.message || "Backup export failed.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async () => {
    if (!importSel.length) {
      errorAlert("Restore ke liye kam se kam ek section select karein.");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setBackupBusy(true);
    try {
      const text = await new File(result.assets[0].uri).text();
      const summary = await importUserBackupWithOptions(user, text, {
        selectedCollections: importSel,
        skipDuplicates,
      });
      toast("success", `Restore complete: ${summary.tasks} tasks, ${summary.notes} notes, ${summary.notebooks} notebooks`);
    } catch (e) {
      errorAlert(e.message || "Backup import failed.");
    } finally {
      setBackupBusy(false);
    }
  };

  const toggle = (setter, name) => setter((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));

  const Selection = ({ selected, setter, label }) => (
    <View style={{ gap: 2 }}>
      <Checkbox
        checked={selected.length === BACKUP_SECTIONS.length}
        onPress={() => setter(selected.length === BACKUP_SECTIONS.length ? [] : allCollections)}
        label={label}
      />
      <View style={styles.selGrid}>
        {BACKUP_SECTIONS.map((s) => (
          <View key={s.collection} style={[styles.selCard, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
            <Checkbox checked={selected.includes(s.collection)} onPress={() => toggle(setter, s.collection)} label={s.label} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 12 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.hero, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" }]}>
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>ADMIN PANEL</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Workspace controls, backup, and session policy</Text>
        <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19 }}>
          Signed in as <Text style={{ fontWeight: "700", color: colors.text }}>{user?.email}</Text>. Backup sirf current logged-in user ke data ka banega, login credentials ka nahi.
        </Text>
        <View style={[styles.pill, { backgroundColor: colors.green + "22" }]}>
          <Shield size={14} color={colors.green} />
          <Text style={{ color: colors.green, fontWeight: "600", fontSize: 12 }}>Admin Active</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHead}><Clock3 size={14} color={colors.text2} /><Text style={[styles.statLabel, { color: colors.text2 }]}>Session Timeout</Text></View>
          <Text style={[styles.statValue, { color: colors.text }]}>Disabled in installed app</Text>
          <Text style={[styles.statSub, { color: colors.text3 }]}>Android app me auto sign-out band rahega, taki offline access chalta rahe.</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHead}><CheckCircle2 size={14} color={colors.text2} /><Text style={[styles.statLabel, { color: colors.text2 }]}>Last Activity</Text></View>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatLastSeen(lastActivityAt)}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHead}><Users size={14} color={colors.text2} /><Text style={[styles.statLabel, { color: colors.text2 }]}>Your Data</Text></View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalItems} items</Text>
          <Text style={[styles.statSub, { color: colors.text3 }]}>{tasks.length} tasks, {notes.length} notes, {notebooks.length} notebooks</Text>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {[
          { key: "backup", label: "Backup / Restore", icon: Database },
          { key: "settings", label: "Settings", icon: Settings2 },
        ].map((t) => {
          const on = activeSection === t.key;
          const Icon = t.icon;
          return (
            <Pressable key={t.key} onPress={() => setActiveSection(t.key)} style={[styles.tab, on && { backgroundColor: colors.surface }]}>
              <Icon size={15} color={on ? colors.accent : colors.text2} />
              <Text style={{ color: on ? colors.text : colors.text2, fontWeight: on ? "600" : "400", fontSize: 13 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeSection === "settings" && (
        <>
          <Card icon={<Shield size={16} color={colors.text} />} title="Allowed Admin Email IDs">
            {adminEmails.map((email) => (
              <View key={email} style={styles.emailRow}>
                <Mail size={14} color={colors.text2} />
                <Text style={{ color: colors.text, fontSize: 13.5 }}>{email}</Text>
              </View>
            ))}
          </Card>
          <Card icon={<Clock3 size={16} color={colors.text} />} title="Session Settings">
            <Text style={{ color: colors.text2, fontSize: 13 }}>Auto sign-out after inactivity (web browser users)</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Input
                value={sessionInput}
                onChangeText={setSessionInput}
                keyboardType="number-pad"
                editable={!saving && !settingsLoading}
                style={{ width: 90 }}
              />
              <Text style={{ color: colors.text2 }}>minutes</Text>
            </View>
            <Btn title={saving ? "Saving..." : "Save Settings"} icon={<Save size={15} color="#fff" />} onPress={handleSave} disabled={saving || settingsLoading} />
            <Bullets items={[
              "Timeout inactivity-based hai, total login time based nahi.",
              "Manual sign out profile menu se normal tareeke se kaam karega.",
              "Installed app (PWA / Android) me auto session timeout disable rahega for offline access.",
              "Ye setting save hote hi browser mode users par next activity cycle me apply ho jayegi.",
            ]} />
          </Card>
        </>
      )}

      {activeSection === "backup" && (
        <>
          <Card icon={<Download size={16} color={colors.text} />} title="Backup Current Login User">
            <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19 }}>
              Backup me sirf abhi jo user login hai uska data aayega. Password, OAuth tokens, ya login credentials backup me include nahi honge.
            </Text>
            <Selection selected={exportSel} setter={setExportSel} label="Select all backup sections" />
            <Btn title={backupBusy ? "Working..." : "Download / Share Backup"} icon={<Download size={15} color="#fff" />} onPress={handleBackupExport} disabled={backupBusy} />
            <Bullets items={[
              `${exportSel.length} sections currently selected for backup.`,
              "Backup JSON ko Files, Drive ya WhatsApp me save kar sakte hain, aur baad me web ya app dono se restore kar sakte hain.",
            ]} />
          </Card>

          <Card icon={<Upload size={16} color={colors.text} />} title="Restore with Duplicate Skip">
            <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19 }}>
              Restore selected sections only. Duplicate match milne par record skip kiya jayega jab niche wala option on hoga.
            </Text>
            <Selection selected={importSel} setter={setImportSel} label="Select all restore sections" />
            <View style={[styles.highlight, { borderColor: colors.accent + "55", backgroundColor: colors.accent + "12" }]}>
              <Checkbox checked={skipDuplicates} onPress={() => setSkipDuplicates((v) => !v)} label="Duplicate records ko skip kare" />
            </View>
            <Btn variant="ghost" title={backupBusy ? "Working..." : "Import Backup"} icon={<Upload size={15} color={colors.text} />} onPress={handleImport} disabled={backupBusy} />
            <Bullets items={[
              `${importSel.length} sections currently selected for restore.`,
              "Restore current account me data add karta hai, existing records ko delete nahi karta.",
              "Imported ya skipped sab data current logged-in user ke account ke under evaluate hoga.",
            ]} />
          </Card>

          <Card icon={<Users size={16} color={colors.text} />} title="Current Account Summary">
            {[["Tasks", tasks.length], ["Notes", notes.length], ["Notebooks", notebooks.length]].map(([k, v]) => (
              <View key={k} style={[styles.sumRow, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.text2 }}>{k}</Text>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{v}</Text>
              </View>
            ))}
          </Card>

          <Card icon={<CheckSquare size={16} color={colors.text} />} title="Restore Rules">
            <Bullets items={[
              "Categories duplicate tab maana jayega jab naam same ho.",
              "Tasks duplicate tab maana jayega jab title, completion state, aur subtasks same hon.",
              "Notes duplicate tab maana jayega jab text, HTML aur color same hon.",
              "Notebook, section aur page restore me naam/content ke basis par duplicate skip hoga.",
            ]} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  stats: { gap: 10 },
  stat: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  statHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { fontSize: 12, fontWeight: "600" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statSub: { fontSize: 12 },
  tabs: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 3 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  selGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selCard: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, minWidth: "46%", flexGrow: 1 },
  highlight: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
