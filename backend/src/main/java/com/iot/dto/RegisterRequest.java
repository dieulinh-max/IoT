package com.iot.dto;

import java.time.LocalDate;

public class RegisterRequest {
    private String name;
    private String msv;
    private LocalDate date;
    private String password;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMsv() { return msv; }
    public void setMsv(String msv) { this.msv = msv; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
