import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";

export async function shareContent(title, text) {
  try {
    const r = await Share.share({ title, message: text });
    return r.action === Share.dismissedAction ? "cancelled" : "shared";
  } catch {
    await Clipboard.setStringAsync(text);
    return "copied";
  }
}

export async function copyText(text) {
  await Clipboard.setStringAsync(text || "");
}
