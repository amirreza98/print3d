package com.print3d.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /**
     * Public endpoints need no token. Everything else requires a valid JWT,
     * which is verified locally against auth-service's JWKS (configured in
     * application.yml as jwk-set-uri). Role checks for owner-only actions are
     * enforced at the individual services, which read the role claim.
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeExchange(exchange -> exchange
                // Auth flows are public (that's where you get your token)
                .pathMatchers("/api/auth/**").permitAll()
                // Browsing the catalog is public; buying is not
                .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                // Health + metrics
                .pathMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                // Preflight
                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Everything else needs a verified token
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            System.getenv().getOrDefault("FRONTEND_ORIGIN", "http://localhost:3000")
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
