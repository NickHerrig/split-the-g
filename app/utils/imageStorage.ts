import { supabase } from "~/utils/supabase";

export async function uploadImage(base64Data: string, folder: string): Promise<string> {
  const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
  const blob = await base64Response.blob();

  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

  const { data, error } = await supabase.storage
    .from('split-g-images')
    .upload(filename, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600'
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('split-g-images')
    .getPublicUrl(filename);

  return publicUrl;
}