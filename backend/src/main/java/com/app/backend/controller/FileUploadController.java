package com.app.backend.controller;

import com.app.backend.service.CloudinaryStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/files")
public class FileUploadController {
    private final CloudinaryStorageService storageService;

    public FileUploadController(CloudinaryStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "posts") String folder) {
        try {
            return ResponseEntity.ok(storageService.upload(file, folder));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Không thể tải file lên Cloudinary: " + ex.getMessage()));
        }
    }

    @PostMapping("/signature")
    public ResponseEntity<?> createUploadSignature(
            @RequestParam(value = "folder", defaultValue = "posts") String folder,
            @RequestParam(value = "type", defaultValue = "file") String type) {
        return ResponseEntity.ok(storageService.createDirectUploadSignature(folder, type));
    }
}
