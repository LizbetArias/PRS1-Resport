import { ReportService } from "./../service/report.service"
import { RouterModule } from "@angular/router"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { Component, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReportFormComponent } from "../report-modal/report-form/report-form.component"
import Swal from "sweetalert2"

@Component({
  selector: "app-reports-table",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ReportFormComponent],
  templateUrl: "./reports-table.component.html",
  styleUrls: ["./reports-table.component.css"],
})
export class ReportsTableComponent implements OnInit {
  // Datos
  reports: any[] = []
  filteredReports: any[] = []
  pagedReports: any[] = []

  // Filtros
  selectedTrimester = ""
  selectedYear = ""
  startDate = ""
  endDate = ""
  activeFilter: "active" | "inactive" = "active"

  // Paginación
  currentPage = 1
  pageSize = 5
  totalPages = 1

  // Lista de años para el selector
  years: number[] = []

  // Utilidad matemática para el template
  Math = Math

  // Control del formulario modal
  showReportForm = false
  selectedReport: any = null
  isLoading = false

  // Control del visor de imágenes
  showImageViewer = false
  currentImages: string[] = []
  currentImageIndex = 0

  // Control del visor de talleres
  showWorkshopViewer = false
  currentWorkshops: any[] = []
  currentWorkshopIndex = 0
  loadingWorkshops = false

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadInitialReports()
  }

  // Método para cargar todos los reportes inicialmente y extraer los años disponibles
  loadInitialReports(): void {
    this.isLoading = true
    console.log("Cargando reportes iniciales...")

    this.reportService.getallReport().subscribe(
      (data) => {
        console.log("Datos recibidos:", data)

        // Transformar los datos si es necesario
        if (Array.isArray(data)) {
          this.reports = data
        } else {
          // Si no es un array, intentar extraer los datos
          if (data && typeof data === "object") {
            // Si es un objeto con múltiples reportes
            if (Array.isArray(data.reports)) {
              this.reports = data.reports
            }
            // Si es un solo reporte
            else if (data.report) {
              this.reports = [data]
            }
            // Si no tiene una estructura clara, usar como está
            else {
              this.reports = [data]
            }
          } else {
            this.reports = []
            console.error("Formato de datos no reconocido:", data)
          }
        }

        // Extraer los años disponibles para el selector
        this.extractYearsFromReports()

        // Aplicar filtros iniciales (estado activo por defecto)
        this.filterReports()

        this.isLoading = false
      },
      (error) => {
        console.error("Error loading reports:", error)
        this.isLoading = false
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los reportes",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
      },
    )
  }

  extractYearsFromReports(): void {
    const uniqueYears = new Set<number>()

    this.reports.forEach((reportData) => {
      // Extraer el año dependiendo de la estructura
      let year: number | undefined

      if (reportData.year) {
        year = reportData.year
      } else if (reportData.report && reportData.report.year) {
        year = reportData.report.year
      }

      if (year) {
        uniqueYears.add(year)
      }
    })

    this.years = Array.from(uniqueYears).sort((a, b) => b - a) // Ordenar de mayor a menor
  }

  // Método para filtrar los reportes utilizando el endpoint del backend
  filterReports(): void {
    this.isLoading = true
    console.log("Aplicando filtros desde el backend...")

    // Preparar el valor active para el backend
    let activeValue: string | undefined
    if (this.activeFilter === "active") {
      activeValue = "A" // Activo
    } else if (this.activeFilter === "inactive") {
      activeValue = "I" // Inactivo
    }

    // Convertir selectedYear a número si está presente
    const yearValue = this.selectedYear ? Number(this.selectedYear) : undefined

    // Llamar al método del servicio con los filtros actuales
    this.reportService
      .listReportsByFilter(
        this.selectedTrimester, // trimestre
        activeValue, // estado (A/I)
        yearValue, // año
        this.startDate, // fecha inicio
        this.endDate, // fecha fin
      )
      .subscribe(
        (data: any) => {
          console.log("Reportes filtrados recibidos:", data)

          // Procesar los datos según la estructura que devuelve el backend
          if (Array.isArray(data)) {
            // Si es un array de reportes
            this.filteredReports = data
          } else if (data && typeof data === "object") {
            if (data.report) {
              // Si es un objeto con la estructura {report: {...}, workshop: [...]}
              this.filteredReports = [data]
            } else if (Array.isArray(data.reports)) {
              // Si es un objeto con la estructura {reports: [...]}
              this.filteredReports = data.reports
            } else {
              // Si es otro tipo de objeto, tratarlo como un solo reporte
              this.filteredReports = [data]
            }
          } else {
            this.filteredReports = []
          }

          // Actualizar la paginación
          this.totalPages = Math.ceil(this.filteredReports.length / this.pageSize)
          this.currentPage = 1 // Regresar a la primera página al aplicar filtros
          this.updatePagedReports()

          this.isLoading = false
        },
        (error) => {
          console.error("Error al filtrar reportes:", error)
          this.isLoading = false
          Swal.fire({
            title: "Error",
            text: "No se pudieron filtrar los reportes",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    this.selectedTrimester = ""
    this.selectedYear = ""
    this.startDate = ""
    this.endDate = ""
    this.activeFilter = "active"

    // Recargar todos los reportes con el filtro de estado activo
    this.filterReports()
  }

  updatePagedReports(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize
    const endIndex = startIndex + this.pageSize
    this.pagedReports = this.filteredReports.slice(startIndex, endIndex)
    console.log("Reportes paginados:", this.pagedReports)
  }

  // Métodos de paginación
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePagedReports()
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePagedReports()
    }
  }

  goToPage(page: number): void {
    this.currentPage = page
    this.updatePagedReports()
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = []
    const maxVisiblePages = 5

    if (this.totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si hay menos de maxVisiblePages
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Lógica para mostrar un número limitado de páginas con la actual en el centro
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = startPage + maxVisiblePages - 1

      if (endPage > this.totalPages) {
        endPage = this.totalPages
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }

    return pageNumbers
  }

  // Métodos para los filtros
  setActiveFilter(filter: "active" | "inactive"): void {
    this.activeFilter = filter
    this.filterReports()
  }

  refreshReports(): void {
    // Aplicar los filtros actuales
    this.filterReports()
  }

  // Acciones de reporte
  viewReport(reportData: any): void {
    this.isLoading = true
    const reportId = reportData.report ? reportData.report.id : reportData.id

    console.log("Viendo reporte con ID:", reportId)

    // Usar el nuevo método con filtros de fecha si están presentes
    if (this.startDate || this.endDate) {
      this.reportService.getReportByIdWithDateFilter(reportId, this.startDate, this.endDate).subscribe(
        (detailedReport) => {
          console.log("Detalles del reporte filtrado por fecha:", detailedReport)
          this.selectedReport = detailedReport
          this.showReportForm = true
          this.isLoading = false
        },
        (error) => {
          console.error("Error loading report details:", error)
          this.isLoading = false
          Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los detalles del reporte",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
    } else {
      // Si no hay filtros de fecha, usar el método original
      this.reportService.getReportById(reportId).subscribe(
        (detailedReport) => {
          console.log("Detalles del reporte:", detailedReport)
          this.selectedReport = detailedReport
          this.showReportForm = true
          this.isLoading = false
        },
        (error) => {
          console.error("Error loading report details:", error)
          this.isLoading = false
          Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los detalles del reporte",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
    }
  }

  editReport(reportData: any): void {
    this.isLoading = true
    const reportId = reportData.report ? reportData.report.id : reportData.id

    Swal.fire({
      title: "Cargando datos",
      text: "Por favor espere...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    // Usar el nuevo método con filtros de fecha si están presentes
    if (this.startDate || this.endDate) {
      this.reportService.getReportByIdWithDateFilter(reportId, this.startDate, this.endDate).subscribe(
        (detailedReport) => {
          console.log("Editando reporte filtrado por fecha:", detailedReport)
          this.selectedReport = detailedReport
          this.showReportForm = true
          this.isLoading = false
          Swal.close()
        },
        (error) => {
          console.error("Error loading report details:", error)
          this.isLoading = false
          Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los detalles del reporte",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
    } else {
      // Si no hay filtros de fecha, usar el método original
      this.reportService.getReportById(reportId).subscribe(
        (detailedReport) => {
          console.log("Editando reporte:", detailedReport)
          this.selectedReport = detailedReport
          this.showReportForm = true
          this.isLoading = false
          Swal.close()
        },
        (error) => {
          console.error("Error loading report details:", error)
          this.isLoading = false
          Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los detalles del reporte",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
    }
  }

  createReport(): void {
    this.selectedReport = null
    this.showReportForm = true
  }

  closeReportForm(): void {
    this.showReportForm = false
    this.selectedReport = null
  }

  onReportSaved(report: any): void {
    Swal.fire({
      title: "Éxito",
      text: "El reporte ha sido guardado correctamente",
      icon: "success",
      confirmButtonText: "Aceptar",
    })
    // Recargar reportes con los filtros actuales
    this.filterReports()
  }

  deleteReport(reportData: any): void {
    const report = reportData.report || reportData

    Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el reporte del ${report.trimester} ${report.year}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.reportService.deleteReport(report.id).subscribe(
          () => {
            this.isLoading = false
            Swal.fire("¡Eliminado!", "El reporte ha sido eliminado correctamente.", "success")
            // Recargar reportes con los filtros actuales
            this.filterReports()
          },
          (error) => {
            this.isLoading = false
            console.error("Error deleting report:", error)
            Swal.fire("Error", "No se pudo eliminar el reporte.", "error")
          },
        )
      }
    })
  }

  restoreReport(reportData: any): void {
    const report = reportData.report || reportData

    Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas restaurar el reporte del ${report.trimester} ${report.year}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.reportService.restoreReport(report.id).subscribe(
          () => {
            this.isLoading = false
            Swal.fire("¡Restaurado!", "El reporte ha sido restaurado correctamente.", "success")
            // Recargar reportes con los filtros actuales
            this.filterReports()
          },
          (error) => {
            this.isLoading = false
            console.error("Error restoring report:", error)
            Swal.fire("Error", "No se pudo restaurar el reporte.", "error")
          },
        )
      }
    })
  }

  downloadPdf(reportData: any): void {
    const reportId = reportData.report ? reportData.report.id : reportData.id
    this.reportService.downloadReportPdf(reportId)
  }

  // Métodos para el visor de imágenes
  viewWorkshopImages(workshop: any): void {
    console.log("Imágenes del taller:", workshop.imageUrl)

    if (workshop.imageUrl && workshop.imageUrl.length > 0) {
      this.currentImages = workshop.imageUrl.map((url: string) => {
        // Convertir base64 o URL a formato visualizable
        if (url.startsWith("http")) {
          return url
        } else if (url.startsWith("data:image")) {
          return url
        } else if (url.startsWith("iVBOR") || url.startsWith("ASUN") || url.includes("/9j/") || url.includes("+/9k=")) {
          return `data:image/png;base64,${url}`
        } else {
          return "/assets/placeholder-image.png"
        }
      })

      console.log("Imágenes procesadas:", this.currentImages)
      this.currentImageIndex = 0
      this.showImageViewer = true
    } else {
      Swal.fire({
        title: "Información",
        text: "Este taller no tiene imágenes",
        icon: "info",
        confirmButtonText: "Aceptar",
      })
    }
  }

  // Método para ver los talleres de un reporte
  viewWorkshops(reportData: any): void {
    // Extraer los talleres dependiendo de la estructura
    const workshops = reportData.workshop || (reportData.report ? reportData.report.workshop : [])

    if (workshops && workshops.length > 0) {
      console.log("Talleres a mostrar:", workshops)

      // Mostrar un indicador de carga
      this.loadingWorkshops = true
      Swal.fire({
        title: "Cargando talleres",
        text: "Por favor espere...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Obtener los detalles completos de cada taller, incluyendo imágenes
      this.loadWorkshopsWithImages(workshops)
    } else {
      Swal.fire({
        title: "Información",
        text: "Este reporte no tiene talleres registrados",
        icon: "info",
        confirmButtonText: "Aceptar",
      })
    }
  }

  // Método para cargar los talleres con sus imágenes
  loadWorkshopsWithImages(workshops: any[]): void {
    // Primero, obtener el reporte detallado para asegurarnos de tener los datos completos
    const reportId = workshops[0].reportId

    // Usar el nuevo método con filtros de fecha si están presentes
    if (this.startDate || this.endDate) {
      this.reportService.getReportByIdWithDateFilter(reportId, this.startDate, this.endDate).subscribe(
        (detailedReport) => {
          console.log("Reporte detallado filtrado por fecha:", detailedReport)
          this.processWorkshopsFromReport(detailedReport)
        },
        (error) => {
          this.handleWorkshopLoadError(error)
        },
      )
    } else {
      // Si no hay filtros de fecha, usar el método original
      this.reportService.getReportById(reportId).subscribe(
        (detailedReport) => {
          console.log("Reporte detallado:", detailedReport)
          this.processWorkshopsFromReport(detailedReport)
        },
        (error) => {
          this.handleWorkshopLoadError(error)
        },
      )
    }
  }

  // Método auxiliar para procesar los talleres de un reporte
  private processWorkshopsFromReport(detailedReport: any): void {
    // Extraer los talleres con imágenes del reporte detallado
    let detailedWorkshops = []

    if (detailedReport.workshop && Array.isArray(detailedReport.workshop)) {
      detailedWorkshops = detailedReport.workshop
    } else if (
      detailedReport.report &&
      detailedReport.report.workshop &&
      Array.isArray(detailedReport.report.workshop)
    ) {
      detailedWorkshops = detailedReport.report.workshop
    }

    console.log("Talleres detallados:", detailedWorkshops)

    // Actualizar los talleres con los datos detallados
    this.currentWorkshops = detailedWorkshops
    this.currentWorkshopIndex = 0
    this.showWorkshopViewer = true
    this.loadingWorkshops = false
    Swal.close()
  }

  // Método auxiliar para manejar errores al cargar talleres
  private handleWorkshopLoadError(error: any): void {
    console.error("Error al cargar los detalles del reporte:", error)
    this.loadingWorkshops = false
    Swal.fire({
      title: "Error",
      text: "No se pudieron cargar los detalles de los talleres",
      icon: "error",
      confirmButtonText: "Aceptar",
    })
  }

  // Método auxiliar para filtrar talleres por fecha (util para visualización local si es necesario)
  filterWorkshopsByDate(workshops: any[]): any[] {
    if (!workshops || workshops.length === 0) {
      return []
    }

    return workshops.filter((workshop) => {
      const workshopStartDate = new Date(workshop.startDate)
      const workshopEndDate = new Date(workshop.endDate)

      // Convertir las fechas de filtro a objetos Date
      const filterStartDate = this.startDate ? new Date(this.startDate) : null
      const filterEndDate = this.endDate ? new Date(this.endDate) : null

      // Caso 1: Solo fecha de inicio especificada
      if (filterStartDate && !filterEndDate) {
        // Mostrar talleres que comienzan en o después de la fecha de inicio
        return workshopStartDate >= filterStartDate
      }
      // Caso 2: Solo fecha de fin especificada
      else if (!filterStartDate && filterEndDate) {
        // Mostrar talleres que terminan en o antes de la fecha de fin
        return workshopEndDate <= filterEndDate
      }
      // Caso 3: Ambas fechas especificadas
      else if (filterStartDate && filterEndDate) {
        // Mostrar talleres que caen dentro del rango de fechas
        return (
          (workshopStartDate >= filterStartDate && workshopStartDate <= filterEndDate) ||
          (workshopEndDate >= filterStartDate && workshopEndDate <= filterEndDate) ||
          (workshopStartDate <= filterStartDate && workshopEndDate >= filterEndDate)
        )
      }

      // Si no hay filtros de fecha, incluir todos los talleres
      return true
    })
  }

  // Método para ver las imágenes directamente desde el modal de talleres
  viewCurrentWorkshopImages(): void {
    const currentWorkshop = this.currentWorkshops[this.currentWorkshopIndex]
    if (currentWorkshop && currentWorkshop.imageUrl && currentWorkshop.imageUrl.length > 0) {
      // Process images for viewing
      this.currentImages = currentWorkshop.imageUrl.map((url: string) => {
        // Convertir base64 o URL a formato visualizable
        if (url.startsWith("http")) {
          return url
        } else if (url.startsWith("data:image")) {
          return url
        } else if (url.startsWith("iVBOR") || url.startsWith("ASUN") || url.includes("/9j/") || url.includes("+/9k=")) {
          return `data:image/png;base64,${url}`
        } else {
          return "/assets/placeholder-image.png"
        }
      })

      this.currentImageIndex = 0

      // Use setTimeout to ensure the image viewer opens after the current execution context
      setTimeout(() => {
        this.showImageViewer = true
      }, 0)
    } else {
      Swal.fire({
        title: "Información",
        text: "Este taller no tiene imágenes",
        icon: "info",
        confirmButtonText: "Aceptar",
      })
    }
  }

  closeWorkshopViewer(): void {
    this.showWorkshopViewer = false
  }

  prevWorkshop(): void {
    if (this.currentWorkshopIndex > 0) {
      this.currentWorkshopIndex--
    }
  }

  nextWorkshop(): void {
    if (this.currentWorkshopIndex < this.currentWorkshops.length - 1) {
      this.currentWorkshopIndex++
    }
  }

  closeImageViewer(): void {
    this.showImageViewer = false
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.currentImages.length - 1) {
      this.currentImageIndex++
    }
  }

  // Método para formatear fechas en formato DD/MMM/YYYY
  formatDate(dateString: string | undefined): string {
    if (!dateString) return "Fecha no disponible"

    const date = new Date(dateString)
    const day = date.getDate()
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }
}

