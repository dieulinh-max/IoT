package com.iot.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "User")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "Name", nullable = false, length = 100)
    private String name;

    // Keep Username if it already exists in your database schema.
    @Column(name = "Username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "Password", nullable = false, length = 255)
    private String password;

    @Column(name = "Date")
    private LocalDate date;

    @Column(name = "MSV", nullable = false, unique = true, length = 30)
    private String msv;

    public User() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getMsv() { return msv; }
    public void setMsv(String msv) { this.msv = msv; }
}
