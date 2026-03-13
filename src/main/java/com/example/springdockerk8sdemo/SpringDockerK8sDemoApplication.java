package com.example.springdockerk8sdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SpringDockerK8sDemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringDockerK8sDemoApplication.class, args);
	}
}
