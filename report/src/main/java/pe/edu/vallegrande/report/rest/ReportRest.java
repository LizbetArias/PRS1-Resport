package pe.edu.vallegrande.report.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.report.dto.ReportDto;
import pe.edu.vallegrande.report.model.Report;
import pe.edu.vallegrande.report.service.ReportService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/reports")
public class ReportRest {

    @Autowired
    private ReportService reportService;

    // Listar todos los reportes con sus detalles, con filtros opcionales
    @GetMapping
    public Flux<ReportDto> getAllReports(
            @RequestParam(value = "active", required = false) String active,
            @RequestParam(value = "trimester", required = false) String trimester,
            @RequestParam(value = "year", required = false) String yearStr,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr
    ) {
        // Convertir "Null" en null
        active = "Null".equalsIgnoreCase(active) ? null : active;
        trimester = "Null".equalsIgnoreCase(trimester) ? null : trimester;
        Integer year = ("Null".equalsIgnoreCase(yearStr) || yearStr == null) ? null : Integer.parseInt(yearStr);
        String startDate = "Null".equalsIgnoreCase(startDateStr) ? null : startDateStr;
        String endDate = "Null".equalsIgnoreCase(endDateStr) ? null : endDateStr;

        return reportService.getAllReports(active, trimester, year, startDate, endDate);
    }

    // Obtener todos los reportes sin filtros
    @GetMapping("/all")
    public Flux<ReportDto> getAllReportsWithoutFilter() {
        return reportService.getAllReportsWithoutFilter();
    }

    // Listar un reporte por ID con sus detalles
    @GetMapping("/{id}")
    public Mono<ReportDto> getReportById(@PathVariable Long id) {
        return reportService.getReportById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Report not found with id: " + id)));
    }

    @GetMapping("/{id}/filtered")
    public Mono<ReportDto> getReportByIdWithDateFilter(
            @PathVariable Long id,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate) {
        return reportService.getReportByIdWithDateFilter(id, startDate, endDate);
    }

    // Insertar Report con detalles
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Report> createReport(@RequestBody ReportDto request) {
        return reportService.createReport(request.getReport(), request.getWorkshop());
    }

    // Actualizar Report y sus detalles
    @PutMapping("/{id}")
    public Mono<Report> updateReport(@PathVariable Long id, @RequestBody ReportDto updatedRequest) {
        return reportService.updateReport(id, updatedRequest);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
    }

    //Eliminar reporte lógicamente
    @DeleteMapping("/{id}")
    public Mono<Report> deleteReport(@PathVariable Long id) {
        return reportService.deleteReport(id);
    }

    //Restaurar reporte
    @PutMapping("/restore/{id}")
    public Mono<Report> restoreReport(@PathVariable Long id) {
        return reportService.restoreReport(id);
    }
}

