/**
 * Utilidades para procesamiento y optimización de imágenes en el cliente (Browser).
 * Realiza recorte cuadrado centrado y compresión a WebP (con fallback a JPEG)
 * reduciendo imágenes de 5-10 MB a un promedio ultraliviano de 8 a 15 KB.
 */

export async function compressAndResizeAvatar(
  file: File,
  targetSize: number = 128,
  quality: number = 0.82
): Promise<{ dataUrl: string; originalSizeKb: number; compressedSizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'));
    }

    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('No se pudo inicializar el contexto de imagen del navegador.'));
          }

          // Antialiasing suave
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Calcular recorte cuadrado centrado (aspect-fill)
          const srcWidth = img.width;
          const srcHeight = img.height;
          const minDim = Math.min(srcWidth, srcHeight);
          const srcX = (srcWidth - minDim) / 2;
          const srcY = (srcHeight - minDim) / 2;

          // Dibujar en el canvas redimensionado a targetSize x targetSize
          ctx.drawImage(img, srcX, srcY, minDim, minDim, 0, 0, targetSize, targetSize);

          // Intentar exportar a WebP
          let dataUrl = canvas.toDataURL('image/webp', quality);

          // Fallback a JPEG si el navegador no genera WebP
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Calcular tamaño aproximado del base64 resultante en KB
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const compressedBytes = Math.round(base64Length * 0.75);
          const compressedSizeKb = Math.round(compressedBytes / 1024);

          resolve({
            dataUrl,
            originalSizeKb,
            compressedSizeKb,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al decodificar la imagen seleccionada.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo desde el dispositivo.'));
    };

    reader.readAsDataURL(file);
  });
}
