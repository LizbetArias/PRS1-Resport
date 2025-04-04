package pe.edu.vallegrande.report_workshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "report_workshop")
public class ReportWorkshop {
    @Id
    private Long id;
    @Column("report_id")
    private Long reportId;
    @Column("workshop_name")
    private String workshopName;
    private String description;
    @Column("image_url")
    private String[] imageUrl;
    @Column("start_date")
    private LocalDate startDate;
    @Column("end_date")
    private LocalDate endDate;
}

