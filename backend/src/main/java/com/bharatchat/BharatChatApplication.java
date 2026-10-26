package com.bharatchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BharatChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(BharatChatApplication.class, args);
        System.out.println("🇮🇳 BharatChat Backend Started Successfully!");
        System.out.println("🚀 Server running on http://localhost:8080");
        System.out.println("💬 WebSocket endpoint: ws://localhost:8080/ws");
    }
}
