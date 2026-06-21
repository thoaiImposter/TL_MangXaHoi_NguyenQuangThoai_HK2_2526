package com.app.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "faculties")
public class Faculty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, unique = true, length = 255)
    private String name;

    @Column(nullable = false)
    private Boolean active = true;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public Boolean getActive() { return active; }
}
