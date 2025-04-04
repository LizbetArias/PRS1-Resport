package pe.edu.vallegrande.report_workshop.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.report_workshop.model.ReportWorkshop;
import pe.edu.vallegrande.report_workshop.service.ReportWorkshopService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/workshops")
public class ReportWorkshopRest {

    @Autowired
    private ReportWorkshopService workshopService;

    /**
     * Obtiene todos los workshops por reportId con filtros opcionales de fecha
     */
    @GetMapping("/by-report/{reportId}")
    public Flux<ReportWorkshop> getWorkshopsByReportId(
            @PathVariable Long reportId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return workshopService.getWorkshopsByReportId(reportId, startDate, endDate);
    }

    /**
     * Guarda una lista de workshops
     */
    @PostMapping("/batch")
    public Flux<ReportWorkshop> saveWorkshops(@RequestBody List<ReportWorkshop> workshops) {
        return workshopService.saveWorkshops(workshops);
    }

    /**
     * Actualiza los workshops de un reporte
     */
    @PutMapping("/by-report/{reportId}")
    public Flux<ReportWorkshop> updateWorkshopsByReportId(
            @PathVariable Long reportId,
            @RequestBody List<ReportWorkshop> workshops) {
        return workshopService.updateWorkshopsByReportId(reportId, workshops);
    }

    /**
     * Obtiene un workshop por su ID
     */
    @GetMapping("/{id}")
    public Mono<ReportWorkshop> getWorkshopById(@PathVariable Long id) {
        return workshopService.getWorkshopById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Workshop not found with id: " + id)));
    }

    /**
     * Elimina un workshop por su ID
     */
    @DeleteMapping("/{id}")
    public Mono<Void> deleteWorkshop(@PathVariable Long id) {
        return workshopService.deleteWorkshop(id);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
    }
}

