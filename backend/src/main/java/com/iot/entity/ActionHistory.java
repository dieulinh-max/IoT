package com.iot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "actionhistory")
public class ActionHistory {

    public enum ActionType {
        ON, OFF
    }

    public enum ActionStatus {
        PENDING, SUCCESS, FAIL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    // Nguoi thuc hien thao tac
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    // Thiet bi dau ra duoc dieu khien
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deviceId", nullable = false)
    private Devices device;

    // Lenh bat hoac tat
    @Enumerated(EnumType.STRING)
    @Column(name = "Action", nullable = false)
    private ActionType action;

    // Ket qua thuc hien lenh
    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false)
    private ActionStatus status = ActionStatus.PENDING;

    @Column(
        name = "updatedAt",
        insertable = false,
        updatable = false
    )
    private LocalDateTime updatedAt;

    public ActionHistory() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Devices getDevice() {
        return device;
    }

    public void setDevice(Devices device) {
        this.device = device;
    }

    public ActionType getAction() {
        return action;
    }

    public void setAction(ActionType action) {
        this.action = action;
    }

    public ActionStatus getStatus() {
        return status;
    }

    public void setStatus(ActionStatus status) {
        this.status = status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}