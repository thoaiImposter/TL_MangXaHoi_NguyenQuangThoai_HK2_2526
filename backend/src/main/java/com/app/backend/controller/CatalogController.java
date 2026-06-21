package com.app.backend.controller;

import com.app.backend.dto.FacultyResponse;
import com.app.backend.dto.MajorResponse;
import com.app.backend.repository.FacultyRepository;
import com.app.backend.repository.MajorRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final MajorRepository majors;
    private final FacultyRepository faculties;

    public CatalogController(MajorRepository majors, FacultyRepository faculties) {
        this.majors = majors;
        this.faculties = faculties;
    }

    @GetMapping("/faculties")
    public List<FacultyResponse> faculties() {
        return faculties.findByActiveTrueOrderByNameAsc().stream()
            .map(faculty -> new FacultyResponse(faculty.getId(), faculty.getCode(), faculty.getName()))
            .toList();
    }

    @GetMapping("/majors")
    public List<MajorResponse> majors(@RequestParam(required = false) Long facultyId) {
        return (facultyId == null
                ? majors.findByActiveTrueOrderByNameAsc()
                : majors.findByActiveTrueAndFacultyIdOrderByNameAsc(facultyId))
            .stream()
            .map(major -> new MajorResponse(
                major.getId(), major.getCode(), major.getName(), major.getCampus(),
                major.getFaculty() == null ? null : major.getFaculty().getId(),
                major.getFaculty() == null ? null : major.getFaculty().getName()))
            .toList();
    }
}
