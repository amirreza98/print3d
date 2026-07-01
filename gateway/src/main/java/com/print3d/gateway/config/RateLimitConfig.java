package com.print3d.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;

/**
 * Decides what "one caller" means for rate limiting. A signed-in user is keyed
 * by their token subject (so limits follow the user across IPs); anonymous
 * traffic is keyed by client IP. Used by the RequestRateLimiter filter in
 * application.yml.
 */
@Configuration
public class RateLimitConfig {

    @Bean
    @Primary
    public KeyResolver userKeyResolver() {
        return exchange -> ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication().getName())
            .switchIfEmpty(Mono.fromSupplier(() -> {
                var addr = exchange.getRequest().getRemoteAddress();
                return addr != null ? addr.getAddress().getHostAddress() : "unknown";
            }));
    }
}
