import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  RichText, useEditorBridge, useBridgeState,
  TenTapStartKit, CoreBridge, PlaceholderBridge,
} from "@10play/tentap-editor";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Code, Quote, Undo, Redo,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

function editorCss(bg, text) {
  return `
    * { color: ${text}; }
    html, body { background-color: ${bg}; }
    .ProseMirror { padding: 14px 16px 80px; font-size: 16px; line-height: 1.55; min-height: 100vh; outline: none; }
    blockquote { border-left: 3px solid ${text}88; margin-left: 0; padding-left: 12px; }
    code { background: rgba(127,127,127,0.2); border-radius: 4px; padding: 1px 4px; }
    pre { background: rgba(127,127,127,0.2); border-radius: 6px; padding: 10px; }
    pre code { background: none; padding: 0; }
    p.is-editor-empty:first-child::before { color: ${text}80; }
  `;
}

/**
 * useRichEditor — wraps the TenTap (TipTap-in-WebView) bridge.
 * Produces the same HTML as the web app's TipTap StarterKit + Underline editor.
 */
export function useRichEditor({ initialContent = "", placeholder = "", bg, text, onChange, autofocus = false }) {
  const editor = useEditorBridge({
    initialContent,
    autofocus,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(editorCss(bg, text)),
      PlaceholderBridge.configureExtension({ placeholder }),
    ],
    theme: { webview: { backgroundColor: bg } },
    onChange,
  });

  const { isReady } = useBridgeState(editor);
  const css = useMemo(() => editorCss(bg, text), [bg, text]);

  // Re-apply colours live (note colour picker / theme toggle)
  useEffect(() => {
    if (isReady) editor.injectCSS(css, "nt-theme");
  }, [isReady, css, editor]);

  return editor;
}

export function RichEditorView({ editor, bg, toolbarBg, full = false }) {
  const { colors } = useTheme();
  const s = useBridgeState(editor);

  const tools = [
    ...(full ? [
      { key: "undo", icon: Undo, active: false, run: () => editor.undo(), disabled: !s.canUndo },
      { key: "redo", icon: Redo, active: false, run: () => editor.redo(), disabled: !s.canRedo },
      "sep",
    ] : []),
    { key: "bold", icon: Bold, active: s.isBoldActive, run: () => editor.toggleBold() },
    { key: "italic", icon: Italic, active: s.isItalicActive, run: () => editor.toggleItalic() },
    { key: "underline", icon: Underline, active: s.isUnderlineActive, run: () => editor.toggleUnderline() },
    { key: "strike", icon: Strikethrough, active: s.isStrikeActive, run: () => editor.toggleStrike() },
    ...(full ? [{ key: "code", icon: Code, active: s.isCodeActive, run: () => editor.toggleCode() }] : []),
    "sep2",
    { key: "bullet", icon: List, active: s.isBulletListActive, run: () => editor.toggleBulletList() },
    { key: "ordered", icon: ListOrdered, active: s.isOrderedListActive, run: () => editor.toggleOrderedList() },
    ...(full ? [{ key: "quote", icon: Quote, active: s.isBlockquoteActive, run: () => editor.toggleBlockquote() }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={[styles.toolbar, { backgroundColor: toolbarBg || colors.surface2, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.toolbarInner}>
          {tools.map((t) => {
            if (typeof t === "string") return <View key={t} style={[styles.sep, { backgroundColor: colors.border2 }]} />;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.key}
                onPress={t.run}
                disabled={t.disabled}
                style={[styles.tb, t.active && { backgroundColor: colors.accent + "33" }, t.disabled && { opacity: 0.35 }]}
              >
                <Icon size={17} color={t.active ? colors.accent : colors.text} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <RichText editor={editor} style={{ flex: 1, backgroundColor: bg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { borderBottomWidth: 1 },
  toolbarInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 5, gap: 2 },
  tb: { width: 38, height: 36, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  sep: { width: 1, height: 20, marginHorizontal: 6 },
});
