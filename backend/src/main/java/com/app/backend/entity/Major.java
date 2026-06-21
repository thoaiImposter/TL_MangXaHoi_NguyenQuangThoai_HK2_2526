package com.app.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "majors")
public class Major {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 50)
    private String campus;

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @Column(nullable = false)
    private Boolean active = true;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getCampus() { return campus; }
    public Faculty getFaculty() { return faculty; }
    public Boolean getActive() { return active; }
}
