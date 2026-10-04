import { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

/**
 * Minimal renderer for the HTML that the TipTap editor produces
 * (p, br, strong, em, u, s, code, pre, blockquote, ul, ol, li, h1-h6, a, mark).
 * Good enough for previews and read-only views without pulling in a WebView.
 */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
function decode(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const VOID = new Set(["br", "hr", "img"]);

function parse(html) {
  const root = { tag: "root", children: [] };
  const stack = [root];
  const re = /<\/?([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[3] !== undefined) {
      top.children.push({ text: decode(m[3]) });
      continue;
    }
    const tag = m[1].toLowerCase();
    const closing = m[0][1] === "/";
    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }
    const node = { tag, children: [] };
    top.children.push(node);
    if (!VOID.has(tag) && !m[0].endsWith("/>")) stack.push(node);
  }
  return root;
}

const INLINE_STYLE = {
  strong: { fontWeight: "700" },
  b: { fontWeight: "700" },
  em: { fontStyle: "italic" },
  i: { fontStyle: "italic" },
  u: { textDecorationLine: "underline" },
  s: { textDecorationLine: "line-through" },
  strike: { textDecorationLine: "line-through" },
  del: { textDecorationLine: "line-through" },
  a: { textDecorationLine: "underline" },
  code: { fontFamily: Platform.select({ android: "monospace", default: "Courier" }), backgroundColor: "rgba(127,127,127,0.18)" },
  mark: { backgroundColor: "rgba(250,204,21,0.45)" },
};

const BLOCK = new Set(["p", "div", "ul", "ol", "li", "blockquote", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "hr"]);

function hasBlockChild(node) {
  return node.children?.some((c) => c.tag && BLOCK.has(c.tag));
}

function renderInline(nodes, keyPrefix) {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    if (n.text !== undefined) return n.text;
    if (n.tag === "br") return "\n";
    return (
      <Text key={key} style={INLINE_STYLE[n.tag]}>
        {renderInline(n.children, key)}
      </Text>
    );
  });
}

function Blocks({ nodes, color, fontSize, keyPrefix = "b", listType, depth = 0 }) {
  const out = [];
  let inlineRun = [];

  const flush = () => {
    if (!inlineRun.length) return;
    const onlyWs = inlineRun.every((n) => n.text !== undefined && !n.text.trim());
    if (!onlyWs) {
      out.push(
        <Text key={`${keyPrefix}-t${out.length}`} style={{ color, fontSize, lineHeight: fontSize * 1.45 }}>
          {renderInline(inlineRun, `${keyPrefix}-i${out.length}`)}
        </Text>
      );
    }
    inlineRun = [];
  };

  let liIndex = 0;
  nodes.forEach((n, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!n.tag || !BLOCK.has(n.tag)) { inlineRun.push(n); return; }
    flush();
    switch (n.tag) {
      case "p":
      case "div":
        out.push(
          hasBlockChild(n)
            ? <Blocks key={key} nodes={n.children} color={color} fontSize={fontSize} keyPrefix={key} depth={depth} />
            : (
              <Text key={key} style={{ color, fontSize, lineHeight: fontSize * 1.45, marginBottom: 4 }}>
                {n.children.length ? renderInline(n.children, key) : " "}
              </Text>
            )
        );
        break;
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const scale = { h1: 1.6, h2: 1.4, h3: 1.25, h4: 1.15, h5: 1.05, h6: 1 }[n.tag];
        out.push(
          <Text key={key} style={{ color, fontSize: fontSize * scale, fontWeight: "700", marginVertical: 4 }}>
            {renderInline(n.children, key)}
          </Text>
        );
        break;
      }
      case "ul":
      case "ol":
        out.push(
          <View key={key} style={{ marginBottom: 4 }}>
            <Blocks nodes={n.children} color={color} fontSize={fontSize} keyPrefix={key} listType={n.tag} depth={depth + 1} />
          </View>
        );
        break;
      case "li": {
        liIndex += 1;
        const bullet = listType === "ol" ? `${liIndex}.` : depth > 1 ? "◦" : "•";
        out.push(
          <View key={key} style={styles.li}>
            <Text style={{ color, fontSize, lineHeight: fontSize * 1.45, width: listType === "ol" ? 22 : 14 }}>{bullet}</Text>
            <View style={{ flex: 1 }}>
              <Blocks nodes={n.children} color={color} fontSize={fontSize} keyPrefix={key} depth={depth} />
            </View>
          </View>
        );
        break;
      }
      case "blockquote":
        out.push(
          <View key={key} style={[styles.quote, { borderLeftColor: color + "88" }]}>
            <Blocks nodes={n.children} color={color} fontSize={fontSize} keyPrefix={key} depth={depth} />
          </View>
        );
        break;
      case "pre":
        out.push(
          <View key={key} style={styles.pre}>
            <Text style={{ color, fontSize: fontSize * 0.9, fontFamily: INLINE_STYLE.code.fontFamily }}>
              {renderInline(n.children.flatMap((c) => (c.tag === "code" ? c.children : [c])), key)}
            </Text>
          </View>
        );
        break;
      case "hr":
        out.push(<View key={key} style={[styles.hr, { backgroundColor: color + "44" }]} />);
        break;
      default:
        break;
    }
  });
  flush();
  return out;
}

function HtmlView({ html, color, fontSize = 14 }) {
  const tree = useMemo(() => parse(html || ""), [html]);
  return (
    <View>
      <Blocks nodes={tree.children} color={color} fontSize={fontSize} />
    </View>
  );
}

export default memo(HtmlView);

const styles = StyleSheet.create({
  li: { flexDirection: "row", alignItems: "flex-start" },
  quote: { borderLeftWidth: 3, paddingLeft: 10, marginVertical: 4 },
  pre: { backgroundColor: "rgba(127,127,127,0.18)", borderRadius: 6, padding: 8, marginVertical: 4 },
  hr: { height: 1, marginVertical: 8 },
});
