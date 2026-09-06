package com.sih.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(AUTH_HEADER);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());

            if (jwtService.validateToken(token)) {
                try {
                    Long userId = jwtService.extractUserId(token);
                    String role = jwtService.extractRole(token);

                    JwtUserPrincipal principal = new JwtUserPrincipal(userId, role);
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                    var authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (RuntimeException ex) {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
