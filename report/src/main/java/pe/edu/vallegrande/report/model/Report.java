package pe.edu.vallegrande.report.model;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "report")
public class Report {
    @Id
    private Long id;
    private int year;
    private String trimester;
    private String description;
    private String schedule;
    private String active;
}
