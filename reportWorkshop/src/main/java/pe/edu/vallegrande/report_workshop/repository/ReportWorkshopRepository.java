package pe.edu.vallegrande.report_workshop.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.report_workshop.model.ReportWorkshop;
import reactor.core.publisher.Flux;

@Repository
public interface ReportWorkshopRepository extends ReactiveCrudRepository<ReportWorkshop, Long> {
    Flux<ReportWorkshop> findByReportId(Long reportId);
}

