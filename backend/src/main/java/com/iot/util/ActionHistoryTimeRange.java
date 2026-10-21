package com.iot.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

public final class ActionHistoryTimeRange {

    private ActionHistoryTimeRange() {
    }

    public record Range(
            LocalDateTime startTime,
            LocalDateTime endTime) {
    }

    private enum Precision {
        DATE,
        HOUR,
        MINUTE,
        SECOND
    }

    private record ParsedTime(
            LocalDateTime start,
            LocalDateTime end,
            Precision precision) {
    }

    public static Range parse(String startValue, String endValue) {
        ParsedTime start = parseOne(startValue);
        ParsedTime end = parseOne(endValue);

        if (start == null && end == null) {
            return new Range(null, null);
        }

        LocalDateTime from;
        LocalDateTime to;

        if (start != null && end != null) {
            from = start.start();
            to = end.end();

        } else if (start != null) {
            // Chi nhap mot moc: loc tron ngay/gio/phut/giay
            from = start.start();
            to = start.end();

        } else {
            from = end.start();
            to = end.end();
        }

        if (from.isAfter(to)) {
            throw new IllegalArgumentException(
                "Thời gian bắt đầu không được lớn hơn thời gian kết thúc."
            );
        }

        return new Range(from, to);
    }

    private static ParsedTime parseOne(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }

        String value = raw.trim().replace('T', ' ');

        try {
            if (!value.matches(
                    "\\d{4}-\\d{2}-\\d{2}"
                    + "(?: \\d{2}(?::\\d{2}(?::\\d{2})?)?)?")) {
                throw new IllegalArgumentException(
                    "Thời gian phải có dạng yyyy-MM-dd HH:mm:ss "
                    + "hoặc yyyy-MM-dd HH:mm."
                );
            }

            LocalDate date = LocalDate.parse(value.substring(0, 10));
            String time = value.length() > 10
                ? value.substring(11)
                : "";

            LocalDateTime base;
            Precision precision;

            if (time.isEmpty()) {
                base = date.atStartOfDay();
                precision = Precision.DATE;

            } else if (time.length() == 2) {
                int hour = Integer.parseInt(time);
                base = date.atTime(hour, 0);
                precision = Precision.HOUR;

            } else if (time.length() == 5) {
                int hour = Integer.parseInt(time.substring(0, 2));
                int minute = Integer.parseInt(time.substring(3, 5));

                base = date.atTime(hour, minute);
                precision = Precision.MINUTE;

            } else if (time.length() == 8) {
                int hour = Integer.parseInt(time.substring(0, 2));
                int minute = Integer.parseInt(time.substring(3, 5));
                int second = Integer.parseInt(time.substring(6, 8));

                base = date.atTime(hour, minute, second);
                precision = Precision.SECOND;

            } else {
                throw new IllegalArgumentException(
                    "Định dạng thời gian không hợp lệ."
                );
            }

            LocalDateTime inclusiveEnd;

            switch (precision) {
                case DATE:
                    inclusiveEnd = base.plusDays(1).minusNanos(1);
                    break;

                case HOUR:
                    inclusiveEnd = base.plusHours(1).minusNanos(1);
                    break;

                case MINUTE:
                    inclusiveEnd = base.plusMinutes(1).minusNanos(1);
                    break;

                case SECOND:
                    inclusiveEnd = base.plusSeconds(1).minusNanos(1);
                    break;

                default:
                    throw new IllegalStateException(
                        "Độ chính xác thời gian không hợp lệ."
                    );
            }

            return new ParsedTime(base, inclusiveEnd, precision);

        } catch (DateTimeParseException | NumberFormatException e) {
            throw new IllegalArgumentException(
                "Thời gian không hợp lệ. Hãy nhập yyyy-MM-dd HH:mm:ss "
                + "hoặc yyyy-MM-dd HH:mm.",
                e
            );
        }
    }
}