
package com.iot.dto;

public class ProfileResponse {

    private String name;
    private String studentId;
    private String dob;

    public ProfileResponse(
            String name,
            String studentId,
            String dob) {
        this.name = name;
        this.studentId = studentId;
        this.dob = dob;
    }

    public String getName() {
        return name;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getDob() {
        return dob;
    }
}
