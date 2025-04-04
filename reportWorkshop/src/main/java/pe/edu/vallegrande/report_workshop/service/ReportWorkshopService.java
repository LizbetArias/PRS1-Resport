package pe.edu.vallegrande.report_workshop.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.report_workshop.model.ReportWorkshop;
import pe.edu.vallegrande.report_workshop.repository.ReportWorkshopRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ReportWorkshopService {

    @Autowired
    private ReportWorkshopRepository workshopRepository;

    /**
     * Obtiene todos los workshops por reportId con filtros opcionales de fecha
     */
    public Flux<ReportWorkshop> getWorkshopsByReportId(Long reportId, String startDateStr, String endDateStr) {
        LocalDate startDate = null;
        LocalDate endDate = null;

        try {
            if (startDateStr != null && !startDateStr.equalsIgnoreCase("null")) {
                startDate = LocalDate.parse(startDateStr);
            }
            if (endDateStr != null && !endDateStr.equalsIgnoreCase("null")) {
                endDate = LocalDate.parse(endDateStr);
            }
        } catch (DateTimeParseException e) {
            return Flux.error(new RuntimeException("Invalid date format. Expected yyyy-MM-dd"));
        }

        LocalDate finalStartDate = startDate;
        LocalDate finalEndDate = endDate;

        return workshopRepository.findByReportId(reportId)
                .filter(workshop -> {
                    if (finalStartDate != null && finalEndDate != null) {
                        return !workshop.getStartDate().isBefore(finalStartDate) &&
                                !workshop.getEndDate().isAfter(finalEndDate);
                    } else if (finalStartDate != null) {
                        return !workshop.getStartDate().isBefore(finalStartDate);
                    } else if (finalEndDate != null) {
                        return !workshop.getEndDate().isAfter(finalEndDate);
                    }
                    return true; // Si no hay filtros, incluir todos
                });
    }

    /**
     * Guarda una lista de workshops
     */
    public Flux<ReportWorkshop> saveWorkshops(List<ReportWorkshop> workshops) {
        return workshopRepository.saveAll(workshops);
    }

    /**
     * Actualiza los workshops de un reporte
     */
    public Flux<ReportWorkshop> updateWorkshopsByReportId(Long reportId, List<ReportWorkshop> updatedWorkshops) {
        return workshopRepository.findByReportId(reportId)
                .collectList()
                .flatMapMany(existingWorkshops -> {
                    // IDs de workshops existentes
                    List<Long> existingIds = existingWorkshops.stream()
                            .map(ReportWorkshop::getId)
                            .collect(Collectors.toList());

                    // Workshops a crear (nuevos)
                    List<ReportWorkshop> toCreate = updatedWorkshops.stream()
                            .filter(w -> w.getId() == null || !existingIds.contains(w.getId()))
                            .peek(w -> w.setReportId(reportId))
                            .collect(Collectors.toList());

                    // Workshops a actualizar
                    List<ReportWorkshop> toUpdate = updatedWorkshops.stream()
                            .filter(w -> w.getId() != null && existingIds.contains(w.getId()))
                            .peek(w -> w.setReportId(reportId))
                            .collect(Collectors.toList());

                    // IDs de workshops a mantener
                    List<Long> updatedIds = updatedWorkshops.stream()
                            .map(ReportWorkshop::getId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());

                    // Workshops a eliminar
                    List<ReportWorkshop> toDelete = existingWorkshops.stream()
                            .filter(w -> !updatedIds.contains(w.getId()))
                            .collect(Collectors.toList());

                    // Eliminar workshops que ya no existen
                    Flux<ReportWorkshop> deleteFlux = toDelete.isEmpty()
                            ? Flux.empty()
                            : workshopRepository.deleteAll(toDelete).thenMany(Flux.empty());

                    // Actualizar workshops existentes
                    Flux<ReportWorkshop> updateFlux = toUpdate.isEmpty()
                            ? Flux.empty()
                            : workshopRepository.saveAll(toUpdate);

                    // Crear nuevos workshops
                    Flux<ReportWorkshop> createFlux = toCreate.isEmpty()
                            ? Flux.empty()
                            : workshopRepository.saveAll(toCreate);

                    // Combinar todos los flujos
                    return deleteFlux.concatWith(updateFlux).concatWith(createFlux);
                });
    }

    /**
     * Obtiene un workshop por su ID
     */
    public Mono<ReportWorkshop> getWorkshopById(Long id) {
        return workshopRepository.findById(id);
    }

    /**
     * Elimina un workshop por su ID
     */
    public Mono<Void> deleteWorkshop(Long id) {
        return workshopRepository.deleteById(id);
    }
}

