export function transformTextInHtml(html: string, _key: number): string {
  // Text-to-canvas obfuscation is disabled to ensure content remains visible
  // and accessible while the decoder script is being stabilized.
  return html;
}

export function getTextCanvasClientScript(_key: number): string {
  // No-op while text-to-canvas transformation is disabled.
  return "";
}
