import { supabase } from '../../services/supabaseClient';

const BUCKET = 'product-images';
/** Lado maior da foto depois de reduzida (suficiente para os cards e o modal). */
const MAX_SIDE = 1000;
const QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler esta imagem. Use JPG, PNG ou WebP.'));
    };
    image.src = url;
  });
}

/** Reduz a foto para no máximo 1000 px e converte para WebP (ou JPEG, se o navegador não gerar WebP). */
async function compressImage(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  const webp = await toBlob('image/webp');
  const blob = webp?.type === 'image/webp' ? webp : await toBlob('image/jpeg');
  if (!blob) throw new Error('Não foi possível preparar a foto.');
  return blob;
}

/** Envia a foto para o Storage do Supabase e devolve o endereço público dela. */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const blob = await compressImage(file);
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${productId || 'item'}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
