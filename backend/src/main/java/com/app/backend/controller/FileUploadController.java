package com.app.backend.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private static final String UPLOAD_DIR = "uploads/";
    
    // Allowed file types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml", "image/tiff", "image/x-icon"
    );
    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
        "video/mp4", "video/mpeg", "video/webm", "video/ogg", "video/x-msvideo",
        "video/avi", "video/quicktime", "video/x-matroska", "video/3gpp", "video/3gpp2",
        "video/x-flv", "video/x-ms-wmv", "video/x-m4v", "video/avi", "video/mov",
        "video/mp2t", "video/x-ms-asf", "video/x-ms-wmx", "video/x-ms-wvx",
        "application/x-mpegURL", "application/vnd.apple.mpegurl",
        "video/MP2T", "video/3gpp", "video/3gpp2", "video/h261", "video/h263", "video/h264",
        "video/jpeg", "video/jpm", "video/mj2", "video/mp4", "video/mp4v-es", "video/vnd.youtube.yt"
    );
    private static final List<String> ALLOWED_FILE_TYPES = Arrays.asList(
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
        "text/plain", "text/csv", "application/rtf", "application/vnd.oasis.opendocument.text",
        "application/x-tar", "application/gzip", "application/x-gzip"
    );
    
    // Video file extensions for fallback detection
    private static final List<String> VIDEO_EXTENSIONS = Arrays.asList(
        ".mp4", ".webm", ".ogg", ".ogv", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".3gp", ".3gpp",
        ".3g2", ".3gp2", ".mpeg", ".mpg", ".m4v", ".m4p", ".m2v", ".mts", ".m2ts",
        ".vob", ".rm", ".rmvb", ".asf", ".amv", ".f4v", ".f4p", ".f4a", ".f4b"
    );
    
    // Image file extensions for fallback detection
    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".svgz", ".ico",
        ".tiff", ".tif", ".psd", ".ai", ".eps", ".heic", ".heif", ".raw", ".cr2"
    );
    
    /**
     * Detect media type based on file extension when contentType is unavailable or unrecognized
     */
    private String detectMediaTypeFromExtension(String filename, String explicitType) {
        if (filename == null) return "file";
        String lowerFilename = filename.toLowerCase();
        
        // Check if explicit type parameter is provided
        if ("video".equals(explicitType)) return "video";
        if ("image".equals(explicitType)) return "image";
        if ("file".equals(explicitType)) return "file";
        
        // Detect from extension
        for (String ext : VIDEO_EXTENSIONS) {
            if (lowerFilename.endsWith(ext)) return "video";
        }
        for (String ext : IMAGE_EXTENSIONS) {
            if (lowerFilename.endsWith(ext)) return "image";
        }
        
        return "file";
    }

    /** Default extension for each media type */
    private String defaultExtensionForType(String mediaType) {
        switch (mediaType) {
            case "image": return ".jpg";
            case "video": return ".mp4";
            default: return ".bin";
        }
    }

    /** Map common MIME types to file extensions */
    private String extensionFromMimeType(String mimeType) {
        if (mimeType == null) return null;
        switch (mimeType.toLowerCase()) {
            case "image/jpeg": return ".jpg";
            case "image/png": return ".png";
            case "image/gif": return ".gif";
            case "image/webp": return ".webp";
            case "image/bmp": return ".bmp";
            case "image/svg+xml": return ".svg";
            case "video/mp4": return ".mp4";
            case "video/webm": return ".webm";
            case "video/ogg": return ".ogv";
            case "video/quicktime": return ".mov";
            case "video/x-msvideo": return ".avi";
            case "video/3gpp": return ".3gp";
            case "application/pdf": return ".pdf";
            case "application/msword": return ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return ".docx";
            case "application/vnd.ms-excel": return ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return ".xlsx";
            case "application/zip": return ".zip";
            case "application/x-rar-compressed": return ".rar";
            case "text/plain": return ".txt";
            case "text/csv": return ".csv";
            default: return null;
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", required = false, defaultValue = "image") String type) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File rỗng"));
            }

            // Determine media type
            String mediaType;
            String contentType = file.getContentType();
            String originalFilename = file.getOriginalFilename();
            
            if (contentType != null) {
                if (ALLOWED_IMAGE_TYPES.contains(contentType)) {
                    mediaType = "image";
                } else if (ALLOWED_VIDEO_TYPES.contains(contentType)) {
                    mediaType = "video";
                } else if (ALLOWED_FILE_TYPES.contains(contentType) || type.equals("file")) {
                    mediaType = "file";
                } else {
                    // Fallback to extension-based detection
                    mediaType = detectMediaTypeFromExtension(originalFilename, type);
                }
            } else {
                // No contentType, use extension-based detection
                mediaType = detectMediaTypeFromExtension(originalFilename, type);
            }

            // Create upload directory if not exists
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Extract extension from original filename
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            // If no extension found, derive from MIME type or media type
            if (extension.isEmpty()) {
                String mimeExt = extensionFromMimeType(contentType);
                if (mimeExt != null) {
                    extension = mimeExt;
                } else {
                    extension = defaultExtensionForType(mediaType);
                }
            }
            
            String filename = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
            Path filePath = Paths.get(UPLOAD_DIR + filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("mediaType", mediaType);
            response.put("mediaUrl", "/uploads/" + filename);
            response.put("mediaName", originalFilename);
            response.put("mediaSize", file.getSize());
            response.put("filename", filename);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Không thể upload file: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi server: " + e.getMessage()));
        }
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = resolveContentType(filename, filePath);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = resolveContentType(filename, filePath);
            String originalName = resource.getFilename() != null ? resource.getFilename() : filename;

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "attachment; filename=\"" + originalName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Resolve content type using extension fallback */
    private String resolveContentType(String filename, Path filePath) throws IOException {
        // 1. Try Java's probe
        String contentType = Files.probeContentType(filePath);
        if (contentType != null && !contentType.equals("application/octet-stream")) {
            return contentType;
        }
        // 2. Try URLConnection
        contentType = java.net.URLConnection.guessContentTypeFromName(filename);
        if (contentType != null) {
            return contentType;
        }
        // 3. Extension-based fallback
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".bmp")) return "image/bmp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".ogv") || lower.endsWith(".ogg")) return "video/ogg";
        if (lower.endsWith(".avi")) return "video/x-msvideo";
        if (lower.endsWith(".mov")) return "video/quicktime";
        if (lower.endsWith(".3gp")) return "video/3gpp";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".csv")) return "text/csv";
        return "application/octet-stream";
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<?> deleteFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + filename);
            File file = filePath.toFile();

            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            if (file.delete()) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.internalServerError().body("Không thể xóa file");
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi: " + e.getMessage());
        }
    }
}