package com.app.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CloudinaryStorageService {
    private static final Set<String> ALLOWED_FOLDERS = Set.of(
            "posts", "comments", "avatars", "covers", "messages", "groups", "documents"
    );

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryStorageService(
            Cloudinary cloudinary,
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Ham tao signature de frontend upload truc tiep len Cloudinary.
     */
    public DirectUploadSignature createDirectUploadSignature(String requestedFolder, String requestedType) {
        String folder = ALLOWED_FOLDERS.contains(requestedFolder) ? requestedFolder : "posts";
        String resourceType = switch (requestedType == null ? "" : requestedType) {
            case "image" -> "image";
            case "video" -> "video";
            default -> "raw";
        };
        long timestamp = System.currentTimeMillis() / 1000;
        Map<String, Object> parameters = ObjectUtils.asMap(
                "folder", "nlu-social/" + folder,
                "overwrite", false,
                "timestamp", timestamp,
                "unique_filename", true,
                "use_filename", true
        );
        String signature = cloudinary.apiSignRequest(parameters, apiSecret);
        return new DirectUploadSignature(cloudName, apiKey, signature, timestamp, "nlu-social/" + folder, resourceType);
    }

    /**
     * Ham upload file qua backend len Cloudinary va tra ve thong tin media.
     */
    public UploadResult upload(MultipartFile file, String requestedFolder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        String folder = ALLOWED_FOLDERS.contains(requestedFolder) ? requestedFolder : "posts";
        String resourceType = detectResourceType(file.getContentType(), file.getOriginalFilename());

        Map<String, Object> options = ObjectUtils.asMap(
                "folder", "nlu-social/" + folder,
                "resource_type", resourceType,
                "use_filename", true,
                "unique_filename", true,
                "overwrite", false
        );
        if ("raw".equals(resourceType)) {
            options.put("public_id", rawPublicId(file.getOriginalFilename()));
        }

        Map<?, ?> result;
        if (file.getSize() > 50L * 1024 * 1024) {
            Path tempFile = Files.createTempFile("nlu-social-upload-", extensionOf(file.getOriginalFilename()));
            try {
                file.transferTo(tempFile);
                result = cloudinary.uploader().uploadLarge(tempFile.toFile(), options);
            } finally {
                Files.deleteIfExists(tempFile);
            }
        } else {
            result = cloudinary.uploader().upload(file.getBytes(), options);
        }

        return new UploadResult(
                String.valueOf(result.get("secure_url")),
                String.valueOf(result.get("public_id")),
                normalizeMediaType(result.get("resource_type"), file.getContentType()),
                file.getOriginalFilename(),
                file.getSize(),
                result.get("format") == null ? null : String.valueOf(result.get("format"))
        );
    }

    /**
     * Ham chuan hoa resource_type Cloudinary thanh image/video/file cho frontend.
     */
    private String normalizeMediaType(Object resourceType, String contentType) {
        String type = resourceType == null ? "" : String.valueOf(resourceType);
        if ("image".equals(type) || "video".equals(type)) {
            return type;
        }
        if (contentType != null && contentType.startsWith("image/")) return "image";
        if (contentType != null && contentType.startsWith("video/")) return "video";
        return "file";
    }

    /**
     * Ham doan resource_type tu MIME type hoac duoi file.
     */
    private String detectResourceType(String contentType, String filename) {
        if (contentType != null) {
            if (contentType.startsWith("image/")) return "image";
            if (contentType.startsWith("video/")) return "video";
        }
        String lower = filename == null ? "" : filename.toLowerCase();
        if (lower.matches(".*\\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|heic|heif)$")) return "image";
        if (lower.matches(".*\\.(mp4|webm|ogg|ogv|avi|mov|wmv|flv|mkv|3gp|m4v)$")) return "video";
        return "raw";
    }

    /**
     * Ham lay duoi file de tao file tam khi upload file lon.
     */
    private String extensionOf(String filename) {
        if (filename == null) return ".tmp";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".tmp";
    }

    /**
     * Ham tao public_id an toan cho file raw de giu duoi file.
     */
    private String rawPublicId(String filename) {
        String original = filename == null || filename.isBlank() ? "file.bin" : filename;
        int dot = original.lastIndexOf('.');
        String extension = dot >= 0 ? original.substring(dot).toLowerCase() : ".bin";
        String base = dot >= 0 ? original.substring(0, dot) : original;
        String safeBase = base.replaceAll("[^a-zA-Z0-9_-]+", "-").replaceAll("^-+|-+$", "");
        if (safeBase.isBlank()) safeBase = "file";
        return safeBase + "-" + UUID.randomUUID() + extension;
    }

    public record UploadResult(
            String mediaUrl,
            String publicId,
            String mediaType,
            String mediaName,
            long mediaSize,
            String format
    ) {}

    public record DirectUploadSignature(
            String cloudName,
            String apiKey,
            String signature,
            long timestamp,
            String folder,
            String resourceType
    ) {}
}
