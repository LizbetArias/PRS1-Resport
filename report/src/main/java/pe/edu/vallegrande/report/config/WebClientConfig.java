package pe.edu.vallegrande.report.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${workshop.service.url}")
    private String workshopServiceUrl;

    @Bean
    public WebClient workshopWebClient() {
        return WebClient.builder()
                .baseUrl(workshopServiceUrl)
                .build();
    }
}

