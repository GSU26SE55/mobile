import React, { useMemo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/src/lib/theme';

interface Props {
  html: string;
}

// CSP blocks all scripts/frames; only allows https + data images, and inline
// styles from this document itself. Combined with javaScriptEnabled={false}
// below → HTML from the BE (including AI-generated posts) cannot execute anything.
const CSP =
  "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src data:;";

function buildDocument(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    padding: 0 20px 40px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${Colors.text};
    background: ${Colors.bg};
    word-wrap: break-word;
  }
  h1 { font-size: 20px; margin: 20px 0 8px; }
  h2 { font-size: 18px; margin: 18px 0 8px; }
  h3 { font-size: 16px; margin: 16px 0 6px; }
  p { margin: 0 0 12px; }
  li { margin-bottom: 6px; }
  a { color: ${Colors.primaryDark}; }
  img { max-width: 100%; height: auto; margin: 8px 0; border-radius: 12px; }
  blockquote {
    margin: 0 0 12px;
    padding-left: 12px;
    border-left: 3px solid ${Colors.primaryLight};
    color: ${Colors.textMute};
    font-style: italic;
  }
  code { background: ${Colors.card2}; font-size: 13px; padding: 1px 4px; border-radius: 4px; }
  pre { background: ${Colors.card2}; padding: 12px; border-radius: 12px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid rgba(0,0,0,0.08); padding: 6px 8px; }
</style>
</head>
<body>${body}</body>
</html>`;
}

export function BlogContent({ html }: Props) {
  const source = useMemo(() => ({ html: buildDocument(html) }), [html]);

  return (
    <WebView
      style={styles.web}
      originWhitelist={['*']}
      source={source}
      // No JS needed: WebView scrolls on its own, so no need to inject a height-measuring script.
      javaScriptEnabled={false}
      // Block all navigation. http/https links open in the system browser;
      // other schemes (javascript:, file:, intent:) are ignored.
      onShouldStartLoadWithRequest={(req) => {
        if (req.url === 'about:blank' || req.url.startsWith('data:')) return true;
        if (/^https?:\/\//i.test(req.url)) {
          Linking.openURL(req.url).catch(() => {});
        }
        return false;
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
