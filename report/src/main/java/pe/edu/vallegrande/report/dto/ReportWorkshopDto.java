package pe.edu.vallegrande.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportWorkshopDto {
    private Long id;
    private Long reportId;
    private String workshopName;
    private String description;
    private String[] imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;
}

