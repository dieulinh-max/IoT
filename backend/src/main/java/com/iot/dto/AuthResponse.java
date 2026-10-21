package com.iot.dto;

public class AuthResponse {
    private String message;
    private String token; // Thêm trường token
    private Integer id;
    private String name;
    private String msv;
    private String date;

    public AuthResponse(String message, String token, Integer id, String name, String msv, String date) {
        this.message = message;
        this.token = token;
        this.id = id;
        this.name = name;
        this.msv = msv;
        this.date = date;
    }

    public String getMessage() { return message; }
    public String getToken() { return token; }
    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getMsv() { return msv; }
    public String getDate() { return date; }
}