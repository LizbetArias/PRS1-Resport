package pe.edu.vallegrande.report.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import pe.edu.vallegrande.report.dto.ReportDto;
import pe.edu.vallegrande.report.dto.ReportWorkshopDto;
import pe.edu.vallegrande.report.model.Report;
import pe.edu.vallegrande.report.repository.ReportRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private WebClient workshopWebClient;

    /**
     * Obtiene todos los reportes filtrados por estado, trimestre, año y rango de fechas.
     */
    public Flux<ReportDto> getAllReports(String status, String trimester, Integer year, String startDateStr, String endDateStr) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate startDate = null;
        LocalDate endDate = null;

        try {
            if (startDateStr != null) {
                startDate = LocalDate.parse(startDateStr, formatter);
            }
            if (endDateStr != null) {
                endDate = LocalDate.parse(endDateStr, formatter);
            }
        } catch (DateTimeParseException e) {
            return Flux.error(new RuntimeException("Invalid date format. Expected yyyy-MM-dd"));
        }

        return reportRepository.findAll()
                .filter(report -> status == null || report.getActive().equals(status))
                .filter(report -> trimester == null || report.getTrimester().equals(trimester))
                .filter(report -> year == null || report.getYear() == year)
                .sort(Comparator.comparingLong(Report::getId).reversed())
                .flatMap(report -> {
                    String url = "/api/workshops/by-report/" + report.getId();
                    if (startDateStr != null || endDateStr != null) {
                        url += "?";
                        if (startDateStr != null) {
                            url += "startDate=" + startDateStr;
                        }
                        if (startDateStr != null && endDateStr != null) {
                            url += "&";
                        }
                        if (endDateStr != null) {
                            url += "endDate=" + endDateStr;
                        }
                    }

                    return workshopWebClient.get()
                            .uri(url)
                            .retrieve()
                            .bodyToFlux(ReportWorkshopDto.class)
                            .doOnNext(workshop -> workshop.setImageUrl(null))
                            .collectList()
                            .onErrorResume(e -> Mono.just(Collections.emptyList())) // Si falla, lista vacía
                            .map(workshops -> {
                                report.setSchedule(null);
                                return new ReportDto(report, workshops);
                            });
                })
                .switchIfEmpty(Flux.just()); // Si report falla, devuelve lista vacía
    }

    /**
     * Obtiene todos los reportes sin filtros y ordenados de forma descendente.
     */
    public Flux<ReportDto> getAllReportsWithoutFilter() {
        return reportRepository.findAll()
                .sort(Comparator.comparingLong(Report::getId).reversed())
                .flatMap(report -> workshopWebClient.get()
                        .uri("/api/workshops/by-report/" + report.getId())
                        .retrieve()
                        .bodyToFlux(ReportWorkshopDto.class)
                        .collectList()
                        .map(workshops -> {
                            workshops.forEach(workshop -> workshop.setImageUrl(null));
                            report.setSchedule(null);
                            return new ReportDto(report, workshops);
                        })
                );
    }

    /**
     * Obtiene un reporte específico por su ID, incluyendo sus detalles.
     */
    public Mono<ReportDto> getReportById(Long id) {
        return reportRepository.findById(id)
                .flatMap(report -> workshopWebClient.get()
                        .uri("/api/workshops/by-report/" + report.getId())
                        .retrieve()
                        .bodyToFlux(ReportWorkshopDto.class)
                        .collectList()
                        .onErrorResume(e -> Mono.just(Collections.emptyList())) // Si falla, lista vacía
                        .map(workshops -> new ReportDto(report, workshops))
                )
                .switchIfEmpty(Mono.just(new ReportDto(null, Collections.emptyList()))); // Si report falla, devuelve vacío
    }

    /**
     * Obtiene un reporte por su ID con filtro opcional de rango de fechas en los detalles.
     */
    public Mono<ReportDto> getReportByIdWithDateFilter(Long id, String startDateStr, String endDateStr) {
        return reportRepository.findById(id)
                .flatMap(report -> {
                    String url = "/api/workshops/by-report/" + report.getId();
                    if (startDateStr != null || endDateStr != null) {
                        url += "?";
                        if (startDateStr != null && !startDateStr.equalsIgnoreCase("null")) {
                            url += "startDate=" + startDateStr;
                        }
                        if (startDateStr != null && !startDateStr.equalsIgnoreCase("null")
                                && endDateStr != null && !endDateStr.equalsIgnoreCase("null")) {
                            url += "&";
                        }
                        if (endDateStr != null && !endDateStr.equalsIgnoreCase("null")) {
                            url += "endDate=" + endDateStr;
                        }
                    }

                    return workshopWebClient.get()
                            .uri(url)
                            .retrieve()
                            .bodyToFlux(ReportWorkshopDto.class)
                            .collectList()
                            .onErrorResume(e -> Mono.just(Collections.emptyList())) // Si falla, lista vacía
                            .map(workshops -> new ReportDto(report, workshops));
                })
                .switchIfEmpty(Mono.just(new ReportDto(null, Collections.emptyList()))); // Si report falla, devuelve vacío
    }

    /**
     * Crea un nuevo Report junto con sus detalles asociados.
     */
    public Mono<Report> createReport(Report report, List<ReportWorkshopDto> workshops) {
        return reportRepository.save(report)
                .flatMap(savedReport -> {
                    // Clonar la lista de workshops para evitar modificar la original
                    List<ReportWorkshopDto> workshopsToSend = workshops.stream()
                            .map(workshop -> {
                                workshop.setReportId(savedReport.getId()); // Asignar el ID después de guardar
                                return workshop;
                            })
                            .collect(Collectors.toList());

                    // Enviar los workshops al servicio de workshops solo si hay workshops
                    Mono<Void> workshopsMono = workshopsToSend.isEmpty()
                            ? Mono.empty()
                            : workshopWebClient.post()
                            .uri("/api/workshops/batch")
                            .bodyValue(workshopsToSend)
                            .retrieve()
                            .bodyToMono(Void.class);

                    // Retornar el reporte guardado después de procesar los workshops
                    return workshopsMono.thenReturn(savedReport);
                });
    }

    /**
     * Actualiza un reporte existente y sus detalles.
     */
    public Mono<Report> updateReport(Long reportId, ReportDto updatedRequest) {
        return reportRepository.findById(reportId)
                .flatMap(existingReport -> {
                    existingReport.setYear(updatedRequest.getReport().getYear());
                    existingReport.setTrimester(updatedRequest.getReport().getTrimester());
                    existingReport.setDescription(updatedRequest.getReport().getDescription());
                    existingReport.setSchedule(updatedRequest.getReport().getSchedule());

                    return reportRepository.save(existingReport)
                            .flatMap(savedReport -> {
                                // Actualizar los workshops a través del servicio de workshops
                                return workshopWebClient.put()
                                        .uri("/api/workshops/by-report/" + savedReport.getId())
                                        .bodyValue(updatedRequest.getWorkshop())
                                        .retrieve()
                                        .bodyToMono(new ParameterizedTypeReference<List<ReportWorkshopDto>>() {})
                                        .thenReturn(savedReport);
                            });
                });
    }

    /**
     * Marca un reporte como inactivo en lugar de eliminarlo permanentemente.
     */
    public Mono<Report> deleteReport(Long reportId) {
        return reportRepository.findById(reportId)
                .flatMap(report -> {
                    report.setActive("I"); // Inactivar el reporte
                    return reportRepository.save(report);
                });
    }

    /**
     * Restaura un reporte previamente marcado como inactivo.
     */
    public Mono<Report> restoreReport(Long reportId) {
        return reportRepository.findById(reportId)
                .flatMap(report -> {
                    report.setActive("A"); // Restaurar el reporte a activo
                    return reportRepository.save(report);
                });
    }
}

