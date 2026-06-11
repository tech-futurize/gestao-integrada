import { supabase } from "@/lib/supabaseClient";

/**
 * Resolve o caminho do objeto no bucket a partir do anexo salvo.
 * Anexos novos têm `path`; anexos antigos só têm a URL pública gravada.
 */
export function anexoPath(anexo, bucket) {
  if (anexo?.path) return anexo.path;
  const m = anexo?.url?.match(new RegExp(`/${bucket}/(.+)$`));
  return m ? decodeURIComponent(m[1].split("?")[0]) : null;
}

/**
 * Abre um anexo de bucket privado em nova aba via signed URL (1h).
 * Lança erro com mensagem amigável se o caminho não puder ser resolvido.
 */
export async function openAnexo(bucket, anexo) {
  const path = anexoPath(anexo, bucket);
  if (!path) throw new Error("Não foi possível localizar o arquivo no storage.");
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
