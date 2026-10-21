package com.iot.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // Chuỗi secret tối thiểu 256 bits (32 ký tự). Có thể đưa vào application.properties
    private static final String SECRET_STRING = "iot_super_secret_key_for_jwt_token_auth_security_2026";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    
    // Thời hạn token: 24 giờ
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000L;

    public String generateToken(String msv) {
        return Jwts.builder()
                .setSubject(msv)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractMsv(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}