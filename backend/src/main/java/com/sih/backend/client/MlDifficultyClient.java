package com.sih.backend.client;

import com.sih.backend.dto.MlDifficultyRequest;
import com.sih.backend.dto.MlDifficultyResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Talks to the FastAPI ML difficulty prediction service (Issue #5 contract:
 * POST /predict-difficulty). Never throws: any failure (connection refused,
 * timeout, non-2xx, malformed/null body) is logged and reported to the
 * caller as {@code null} so a down ML service can never fail GameResult
 * submission.
 */
@Component
public class MlDifficultyClient {

    private static final Logger log = LoggerFactory.getLogger(MlDifficultyClient.class);

    private final RestClient restClient;

    public MlDifficultyClient(
            @Value("${ml.service.url:http://localhost:8001}") String mlServiceUrl,
            @Value("${ml.service.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${ml.service.read-timeout-ms:3000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeoutMs);
        requestFactory.setReadTimeout(readTimeoutMs);

        this.restClient = RestClient.builder()
                .baseUrl(mlServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * @return the ML-recommended difficulty, or {@code null} if the ML service
     *         could not be reached or returned an unusable response. Callers are
     *         responsible for validating the returned value before persisting it.
     */
    public Integer recommendDifficulty(MlDifficultyRequest request) {
        try {
            MlDifficultyResponse response = restClient
                    .post()
                    .uri("/predict-difficulty")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(MlDifficultyResponse.class);

            return response == null ? null : response.getRecommendedDifficulty();
        } catch (Exception ex) {
            log.warn("ML difficulty prediction call failed, keeping current difficulty: {}", ex.getMessage());
            return null;
        }
    }
}
