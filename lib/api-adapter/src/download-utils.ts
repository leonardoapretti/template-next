// download-utils.ts
// Deve ser importado apenas em Client Components ('use client').

import type { SerializedBlobResponse } from "./types";

/**
 * Converte um SerializedBlobResponse (vindo de uma Server Action) em um
 * download real no browser, sem duplicar lógica em cada página.
 *
 * Uso típico em um Client Component:
 *
 * ```ts
 * const result = await fetchDownloadArquivo(idProjeto, idArquivo);
 * triggerDownload(result);
 * ```
 *
 * @returns `true` se o download foi acionado, `false` se houve erro.
 */
export function triggerDownload(result: SerializedBlobResponse): boolean {
  if (!(result.success && result.blob)) {
    return false;
  }

  const { base64, filename, mimeType } = result.blob;

  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
