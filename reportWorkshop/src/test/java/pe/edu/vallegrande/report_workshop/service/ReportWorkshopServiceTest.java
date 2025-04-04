package pe.edu.vallegrande.report_workshop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.vallegrande.report_workshop.model.ReportWorkshop;
import pe.edu.vallegrande.report_workshop.repository.ReportWorkshopRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReportWorkshopServiceTest {

    @Mock
    private ReportWorkshopRepository workshopRepository;

    @InjectMocks
    private ReportWorkshopService workshopService;

    private ReportWorkshop workshop1;
    private ReportWorkshop workshop2;

    @BeforeEach
    public void setup() {
        // Crear datos de prueba
        workshop1 = new ReportWorkshop(
                1L,
                101L,
                "Taller 1",
                "Descripción 1",
                new String[]{"imagen1.jpg", "imagen2.jpg"},
                LocalDate.of(2023, 1, 1),
                LocalDate.of(2023, 1, 10)
        );

        workshop2 = new ReportWorkshop(
                2L,
                101L,
                "Taller 2",
                "Descripción 2",
                new String[]{"imagen3.jpg", "imagen4.jpg"},
                LocalDate.of(2023, 2, 1),
                LocalDate.of(2023, 2, 15)
        );
    }

    /**
     * Caso de prueba 1: Probar getWorkshopsByReportId sin filtros de fecha
     * Esta prueba verifica que el servicio recupere correctamente los talleres por ID de informe
     * cuando no se aplican filtros de fecha.
     */
    @Test
    public void testGetWorkshopsByReportIdWithoutFilters() {
        // Preparar
        Long reportId = 101L;
        when(workshopRepository.findByReportId(reportId))
                .thenReturn(Flux.just(workshop1, workshop2));

        // Actuar y Afirmar
        StepVerifier.create(workshopService.getWorkshopsByReportId(reportId, null, null))
                .expectNext(workshop1)
                .expectNext(workshop2)
                .verifyComplete();
    }

    /**
     * Caso de prueba 2: Probar getWorkshopsByReportId con filtros de fecha
     * Esta prueba verifica que el servicio filtre correctamente los talleres por rango de fechas.
     */
    @Test
    public void testGetWorkshopsByReportIdWithDateFilters() {
        // Preparar
        Long reportId = 101L;
        String startDate = "2023-01-05";
        String endDate = "2023-02-20"; // Cambiado para incluir workshop2.endDate

        when(workshopRepository.findByReportId(reportId))
                .thenReturn(Flux.just(workshop1, workshop2));

        // Actuar y Afirmar
        StepVerifier.create(workshopService.getWorkshopsByReportId(reportId, startDate, endDate))
                .expectNext(workshop2)
                .verifyComplete();
    }

    /**
     * Caso de prueba 3: Probar el método saveWorkshops
     * Esta prueba verifica que el servicio guarde correctamente una lista de talleres.
     */
    @Test
    public void testSaveWorkshops() {
        // Preparar
        List<ReportWorkshop> workshopsToSave = Arrays.asList(workshop1, workshop2);

        when(workshopRepository.saveAll(workshopsToSave))
                .thenReturn(Flux.fromIterable(workshopsToSave));

        // Actuar y Afirmar
        StepVerifier.create(workshopService.saveWorkshops(workshopsToSave))
                .expectNext(workshop1)
                .expectNext(workshop2)
                .verifyComplete();
    }

    /**
     * Caso de prueba 4: Probar el método updateWorkshopsByReportId
     * Esta prueba verifica que el servicio actualice correctamente los talleres para un informe,
     * manejando la creación de nuevos talleres, la actualización de los existentes y la eliminación de los eliminados.
     */
    @Test
    public void testUpdateWorkshopsByReportId() {
        // Preparar
        Long reportId = 101L;

        // Talleres existentes en la base de datos de prueba
        List<ReportWorkshop> existingWorkshops = Arrays.asList(workshop1, workshop2);

        // Taller actualizado (versión modificada de workshop1)
        ReportWorkshop updatedWorkshop1 = new ReportWorkshop(
                1L,
                101L,
                "Taller Actualizado 1",
                "Descripción Actualizada 1",
                new String[]{"imagen-actualizada1.jpg"},
                LocalDate.of(2023, 3, 1),
                LocalDate.of(2023, 3, 10)
        );

        // Nuevo taller a agregar
        ReportWorkshop newWorkshop = new ReportWorkshop(
                null,
                101L,
                "Nuevo Taller",
                "Nueva Descripción",
                new String[]{"nueva-imagen.jpg"},
                LocalDate.of(2023, 4, 1),
                LocalDate.of(2023, 4, 10)
        );

        // La lista actualizada (workshop2 se elimina, workshop1 se actualiza y se agrega un nuevo taller)
        List<ReportWorkshop> updatedWorkshops = Arrays.asList(updatedWorkshop1, newWorkshop);

        // Comportamiento simulado del repositorio
        when(workshopRepository.findByReportId(reportId))
                .thenReturn(Flux.fromIterable(existingWorkshops));

        when(workshopRepository.deleteAll(Mockito.anyList()))
                .thenReturn(Mono.empty());

        when(workshopRepository.saveAll(Mockito.anyList()))
                .thenAnswer(invocation -> {
                    List<ReportWorkshop> workshops = invocation.getArgument(0);
                    return Flux.fromIterable(workshops);
                });

        // Actuar y Afirmar
        StepVerifier.create(workshopService.updateWorkshopsByReportId(reportId, updatedWorkshops))
                .expectNext(updatedWorkshop1)
                .expectNext(newWorkshop)
                .verifyComplete();
    }
}
