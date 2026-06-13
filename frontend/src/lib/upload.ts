export type UploadFolder = 'posts' | 'comments' | 'avatars' | 'covers' | 'messages' | 'groups' | 'documents';
export type UploadProgress = (percent: number) => void;
export type UploadedFile = {
  mediaType: 'image' | 'video' | 'file';
  mediaUrl: string;
  mediaName: string;
  mediaSize: number;
  publicId: string;
  format?: string;
};

type DirectUploadSignature = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  resourceType: 'image' | 'video' | 'raw';
};

const BACKEND_URL = 'http://localhost:8080/api';
const TEN_MB = 10 * 1024 * 1024;
const ONE_HUNDRED_MB = 100 * 1024 * 1024;

const reportGlobalProgress = (fileName: string, percent: number) => {
  window.dispatchEvent(new CustomEvent('nlu-upload-progress', { detail: { fileName, percent } }));
};

export function detectUploadType(file: File): 'image' | 'video' | 'file' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

export async function uploadFileDirect(
  file: File,
  type = detectUploadType(file),
  folder: UploadFolder = 'posts',
  onProgress?: UploadProgress,
): Promise<UploadedFile> {
  const maximumSize = type === 'video' ? ONE_HUNDRED_MB : TEN_MB;
  if (file.size > maximumSize) {
    const limit = type === 'video' ? '100MB' : '10MB';
    throw new Error(`${file.name} vượt giới hạn ${limit} của Cloudinary hiện tại`);
  }
  reportGlobalProgress(file.name, 0);

  let signatureResponse: Response;
  try {
    const token = localStorage.getItem('social_token');
    signatureResponse = await fetch(
      `${BACKEND_URL}/files/signature?folder=${encodeURIComponent(folder)}&type=${encodeURIComponent(type)}`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
  } catch {
    reportGlobalProgress(file.name, -1);
    throw new Error('Không thể kết nối backend để chuẩn bị tải file');
  }
  if (!signatureResponse.ok) {
    reportGlobalProgress(file.name, -1);
    throw new Error('Không thể chuẩn bị phiên tải file');
  }
  const signed = await signatureResponse.json() as DirectUploadSignature;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.apiKey);
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder);
  formData.append('overwrite', 'false');
  formData.append('unique_filename', 'true');
  formData.append('use_filename', 'true');

  const response = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.(percent);
        reportGlobalProgress(file.name, percent);
      }
    };
    request.onerror = () => {
      reportGlobalProgress(file.name, -1);
      reject(new Error('Mất kết nối khi đang tải file'));
    };
    request.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(request.responseText) as Record<string, unknown>;
      } catch {
        reportGlobalProgress(file.name, -1);
        reject(new Error('Cloud storage trả về dữ liệu không hợp lệ'));
        return;
      }
      if (request.status >= 200 && request.status < 300) resolve(body);
      else {
        reportGlobalProgress(file.name, -1);
        reject(new Error(String((body.error as { message?: string } | undefined)?.message || 'Không thể tải file lên cloud')));
      }
    };
    request.send(formData);
  });

  onProgress?.(100);
  reportGlobalProgress(file.name, 100);
  return {
    mediaType: type,
    mediaUrl: String(response.secure_url),
    mediaName: file.name,
    mediaSize: file.size,
    publicId: String(response.public_id),
    format: response.format ? String(response.format) : undefined,
  };
}

export async function uploadFileUrl(file: File, folder: UploadFolder, onProgress?: UploadProgress): Promise<string> {
  const uploaded = await uploadFileDirect(file, detectUploadType(file), folder, onProgress);
  return uploaded.mediaUrl;
}
