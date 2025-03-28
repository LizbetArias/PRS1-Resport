import { ReportService } from "../../service/report.service"
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core"
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms"
import { RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import Swal from "sweetalert2"

interface ImageUrl {
  file: File | null
  preview: string
  name: string
}

// Agregar esta función de validación fuera de la clase del componente
export function dateRangeValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const startDate = formGroup.get("startDate")?.value
    const endDate = formGroup.get("endDate")?.value

    // Si alguna fecha no está definida, no validamos aún
    if (!startDate || !endDate) {
      return null
    }

    // Convertir strings a objetos Date para comparar
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Verificar si la fecha de fin es anterior a la fecha de inicio
    if (end < start) {
      return { invalidDateRange: true }
    }

    return null
  }
}

@Component({
  selector: "app-report-form",
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: "./report-form.component.html",
  styleUrl: "./report-form.component.css",
})
export class ReportFormComponent implements OnInit {
  @Input() isVisible = false
  @Input() reportData: any = null
  @Output() close = new EventEmitter<void>()
  @Output() saved = new EventEmitter<any>()

  reportForm: FormGroup
  isEditMode = false
  isSubmitting = false
  scheduleFileName = ""
  scheduleFile: File | null = null
  schedulePreview = ""

  // Para manejar las imágenes de los talleres
  workshopImages: ImageUrl[][] = []

  // Para el visor de imágenes
  showImageViewer = false
  currentWorkshopImages: ImageUrl[] = []
  currentImageIndex = 0
  currentImageUrl = ""

  // Para visualizar el cronograma
  showScheduleViewer = false

  // Años disponibles para el selector
  availableYears: number[] = []

  // Meses para formateo de fechas
  months = [
    { value: "01", label: "Ene" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Abr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Ago" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dic" },
  ]

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
  ) {
    this.reportForm = this.createReportForm()
    this.generateYearOptions()
  }

  ngOnInit(): void {
    // Inicializar el array de imágenes
    this.workshopImages = []
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.resetForm()

      if (this.reportData) {
        this.isEditMode = true
        Swal.fire({
          title: "Cargando datos",
          text: "Por favor espere...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
            this.populateForm()
            setTimeout(() => {
              Swal.close()
            }, 500)
          },
        })
      } else {
        this.isEditMode = false
      }
    }
  }

  createReportForm(): FormGroup {
    return this.fb.group({
      id: [null],
      year: [null, Validators.required],
      trimester: [null, Validators.required],
      description: ["", Validators.required],
      schedule: [""],
      workshops: this.fb.array([]),
    })
  }

  generateYearOptions(): void {
    const currentYear = new Date().getFullYear()
    this.availableYears = []
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.availableYears.push(i)
    }
  }

  get workshopsArray(): FormArray {
    return this.reportForm.get("workshops") as FormArray
  }

  resetForm(): void {
    this.reportForm = this.createReportForm()
    this.workshopImages = []
    this.scheduleFileName = ""
    this.scheduleFile = null
    this.schedulePreview = ""
  }

  populateForm(): void {
    if (!this.reportData) return

    // Determinar si los datos vienen en la estructura anidada o directa
    const reportData = this.reportData.report || this.reportData

    // Establecer los valores básicos del reporte
    this.reportForm.patchValue({
      id: reportData.id,
      year: reportData.year,
      trimester: reportData.trimester,
      description: reportData.description,
      schedule: reportData.schedule,
    })

    // Si hay un cronograma, mostrar el nombre del archivo y la vista previa
    if (reportData.schedule) {
      this.scheduleFileName = "Cronograma existente.jpg"
      this.schedulePreview = this.getImagePreview(reportData.schedule)
    }

    // Limpiar y agregar los talleres
    this.workshopsArray.clear()
    this.workshopImages = []

    // Determinar la fuente de los talleres
    const workshops = this.reportData.workshop || (reportData.workshop ? reportData.workshop : [])

    if (workshops && workshops.length > 0) {
      workshops.forEach((workshop: any, index: number) => {
        // Agregar el taller al formulario
        this.workshopsArray.push(this.createWorkshopFormGroup(workshop))

        // Inicializar el array de imágenes para este taller
        this.workshopImages[index] = []

        // Si hay imágenes, crear previsualizaciones
        if (workshop.imageUrl && workshop.imageUrl.length > 0) {
          workshop.imageUrl.forEach((imageUrl: string, imgIndex: number) => {
            // Convertir la URL o base64 a una imagen previsualizable
            this.workshopImages[index].push({
              file: null, // No tenemos el archivo real, solo la URL
              preview: this.getImagePreview(imageUrl),
              name: `Imagen ${imgIndex + 1}`,
            })
          })
        }
      })
    }
  }

  // Convierte una URL o base64 en una URL visualizable
  getImagePreview(imageData: string): string {
    // Si es una URL completa
    if (imageData.startsWith("http")) {
      return imageData
    }

    // Si ya es un data URL
    if (imageData.startsWith("data:image")) {
      return imageData
    }

    // Si es base64 sin el prefijo data:image
    if (
      imageData.startsWith("iVBOR") ||
      imageData.startsWith("ASUN") ||
      imageData.includes("/9j/") ||
      imageData.includes("+/9k=")
    ) {
      return `data:image/png;base64,${imageData}`
    }

    // Si no podemos determinar el formato, usamos un placeholder
    return "/assets/placeholder-image.png"
  }

  createWorkshopFormGroup(workshop: any = null): FormGroup {
    const group = this.fb.group(
      {
        id: [workshop ? workshop.id : null],
        workshopName: [workshop ? workshop.workshopName : "", Validators.required],
        description: [workshop ? workshop.description : ""],
        startDate: [workshop ? workshop.startDate : "", Validators.required],
        endDate: [workshop ? workshop.endDate : "", Validators.required],
        imageUrl: [workshop ? workshop.imageUrl : []],
      },
      { validators: dateRangeValidator() },
    )

    return group
  }

  addWorkshop(): void {
    this.workshopsArray.push(this.createWorkshopFormGroup())
    this.workshopImages.push([])

    // Scroll al nuevo taller
    setTimeout(() => {
      const workshopElements = document.querySelectorAll(".workshop-item")
      if (workshopElements.length > 0) {
        const lastWorkshop = workshopElements[workshopElements.length - 1]
        lastWorkshop.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }

  removeWorkshop(index: number): void {
    Swal.fire({
      title: "¿Está seguro?",
      text: "¿Desea eliminar este taller?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.workshopsArray.removeAt(index)
        this.workshopImages.splice(index, 1)
      }
    })
  }

  onScheduleFileChange(event: any): void {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          title: "Error",
          text: "El cronograma debe ser una imagen (JPG, PNG, etc.)",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        event.target.value = ""
        return
      }

      this.scheduleFile = file
      this.scheduleFileName = file.name

      // Mostrar vista previa
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.schedulePreview = e.target.result
      }
      reader.readAsDataURL(file)
    } else {
      this.scheduleFile = null
      this.scheduleFileName = ""
      this.schedulePreview = ""
    }
  }

  viewSchedule(): void {
    if (this.schedulePreview) {
      this.showScheduleViewer = true
    }
  }

  closeScheduleViewer(): void {
    this.showScheduleViewer = false
  }

  onImageFileChange(event: any, workshopIndex: number): void {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Inicializar el array si no existe
    if (!this.workshopImages[workshopIndex]) {
      this.workshopImages[workshopIndex] = []
    }

    // Validar que todos sean imágenes
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          title: "Error",
          text: "Solo se permiten archivos de imagen (JPG, PNG, etc.)",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        event.target.value = ""
        return
      }
    }

    // Agregar cada imagen seleccionada
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()

      reader.onload = (e: any) => {
        this.workshopImages[workshopIndex].push({
          file: file,
          preview: e.target.result,
          name: file.name,
        })
      }

      reader.readAsDataURL(file)
    }
  }

  removeImage(workshopIndex: number, imageIndex: number): void {
    this.workshopImages[workshopIndex].splice(imageIndex, 1)
  }

  // Métodos para el visor de imágenes
  openImageViewer(workshopIndex: number, imageIndex: number): void {
    this.currentWorkshopImages = this.workshopImages[workshopIndex]
    this.currentImageIndex = imageIndex
    this.currentImageUrl = this.currentWorkshopImages[imageIndex].preview
    this.showImageViewer = true
  }

  closeImageViewer(): void {
    this.showImageViewer = false
  }

  viewImage(index: number): void {
    this.currentImageIndex = index
    this.currentImageUrl = this.currentWorkshopImages[index].preview
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--
      this.currentImageUrl = this.currentWorkshopImages[this.currentImageIndex].preview
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.currentWorkshopImages.length - 1) {
      this.currentImageIndex++
      this.currentImageUrl = this.currentWorkshopImages[this.currentImageIndex].preview
    }
  }

  // Método para formatear fechas en formato DD/MMM/YYYY
  formatDate(dateString: string): string {
    if (!dateString) return ""

    const date = new Date(dateString)
    const day = date.getDate() + 1
    const month = this.months[date.getMonth()].label
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  // Método para obtener el mes y día según el trimestre seleccionado
  getDateRangeForTrimester(trimester: string, year: number): { startMonth: string; endMonth: string } {
    switch (trimester) {
      case "Enero-Marzo":
        return { startMonth: "01", endMonth: "03" }
      case "Abril-Junio":
        return { startMonth: "04", endMonth: "06" }
      case "Julio-Septiembre":
        return { startMonth: "07", endMonth: "09" }
      case "Octubre-Diciembre":
        return { startMonth: "10", endMonth: "12" }
      default:
        return { startMonth: "01", endMonth: "12" }
    }
  }

  // Actualizar fechas de talleres cuando cambia el trimestre o año
  updateWorkshopDates(): void {
    const year = this.reportForm.get("year")?.value
    const trimester = this.reportForm.get("trimester")?.value

    if (year && trimester) {
      const { startMonth, endMonth } = this.getDateRangeForTrimester(trimester, year)

      // Actualizar las fechas de inicio y fin de cada taller
      for (let i = 0; i < this.workshopsArray.length; i++) {
        const workshop = this.workshopsArray.at(i) as FormGroup

        // Solo actualizar si no tienen fechas o si están fuera del trimestre
        if (!workshop.get("startDate")?.value || !workshop.get("endDate")?.value) {
          workshop.patchValue({
            startDate: `${year}-${startMonth}-01`,
            endDate: `${year}-${endMonth}-${new Date(year, Number.parseInt(endMonth), 0).getDate()}`,
          })
        }
      }
    }
  }

  validateWorkshopImages(): boolean {
    let valid = true

    // Verificar que cada taller tenga al menos una imagen
    for (let i = 0; i < this.workshopsArray.length; i++) {
      if (!this.workshopImages[i] || this.workshopImages[i].length === 0) {
        Swal.fire({
          title: "Error de validación",
          text: `El taller #${i + 1} debe tener al menos una imagen`,
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        valid = false
        break
      }
    }

    return valid
  }

  // Modificar el método saveReport para validar los rangos de fechas antes de continuar
  saveReport(): void {
    if (this.reportForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      this.markFormGroupTouched(this.reportForm)
      Swal.fire({
        title: "Formulario incompleto",
        text: "Por favor complete todos los campos requeridos",
        icon: "warning",
        confirmButtonText: "Aceptar",
      })
      return
    }

    // Validar rangos de fechas en todos los talleres
    let fechasInvalidas = false
    for (let i = 0; i < this.workshopsArray.length; i++) {
      const workshop = this.workshopsArray.at(i) as FormGroup
      if (workshop.errors?.["invalidDateRange"]) {
        fechasInvalidas = true
        break
      }
    }

    if (fechasInvalidas) {
      Swal.fire({
        title: "Error de validación",
        text: "Hay talleres con fechas inválidas. La fecha de fin debe ser posterior a la fecha de inicio.",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
      return
    }

    // Validar que cada taller tenga al menos una imagen
    if (!this.validateWorkshopImages()) {
      return
    }

    this.isSubmitting = true
    Swal.fire({
      title: "Guardando",
      text: "Por favor espere...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    // Preparar los datos del reporte
    const reportData = this.prepareReportData()
    console.log("Datos a enviar:", reportData)

    // Llamar al servicio para guardar
    if (this.isEditMode) {
      this.reportService.updateReportById(reportData.report.id, reportData).subscribe(
        (response) => {
          this.handleSaveSuccess(response)
        },
        (error) => {
          this.handleSaveError(error)
        },
      )
    } else {
      this.reportService.newReport(reportData).subscribe(
        (response) => {
          this.handleSaveSuccess(response)
        },
        (error) => {
          this.handleSaveError(error)
        },
      )
    }
  }

  prepareReportData(): any {
    const formValue = this.reportForm.value

    // Preparar los talleres con sus imágenes
    const workshops = formValue.workshops.map((workshop: any, index: number) => {
      // Convertir las imágenes a base64 o URLs
      const imageUrls = this.workshopImages[index].map((img) => {
        // Si ya tenemos una URL o base64, la usamos directamente
        if (!img.file) {
          if (img.preview.startsWith("data:image")) {
            return img.preview.split(",")[1] // Extraer solo la parte base64
          }
          return img.preview
        }

        // Para archivos nuevos, usar la preview que ya está en base64
        if (img.preview.startsWith("data:image")) {
          return img.preview.split(",")[1] // Extraer solo la parte base64
        }
        return img.preview
      })

      return {
        ...workshop,
        imageUrl: imageUrls,
      }
    })

    // Preparar el cronograma
    let scheduleData = formValue.schedule
    if (this.scheduleFile && this.schedulePreview) {
      // Extraer solo la parte base64 del data URL
      scheduleData = this.schedulePreview.startsWith("data:image")
        ? this.schedulePreview.split(",")[1]
        : this.schedulePreview
    }

    // Preparar el reporte completo en la estructura esperada por el backend
    const reportData = {
      report: {
        id: formValue.id,
        year: formValue.year,
        trimester: formValue.trimester,
        description: formValue.description,
        schedule: scheduleData,
        active: "A", // Siempre se inserta como activo
      },
      workshop: workshops,
    }

    return reportData
  }

  handleSaveSuccess(response: any): void {
    this.isSubmitting = false
    Swal.fire({
      title: "¡Éxito!",
      text: "El reporte ha sido guardado correctamente",
      icon: "success",
      confirmButtonText: "Aceptar",
    })
    // Emitir evento de guardado exitoso
    this.saved.emit(response)
    // Cerrar el modal
    this.closeModal()
  }

  handleSaveError(error: any): void {
    this.isSubmitting = false
    console.error("Error al guardar el reporte:", error)
    Swal.fire({
      title: "Error",
      text: "Ocurrió un error al guardar el reporte. Por favor, intente nuevamente.",
      icon: "error",
      confirmButtonText: "Aceptar",
    })
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else if (control instanceof FormArray) {
        control.controls.forEach((ctrl) => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl)
          } else {
            ctrl.markAsTouched()
          }
        })
      }
    })
  }

  closeModal(): void {
    this.close.emit()
  }

  // Añadir este método para validar las fechas de un taller específico cuando cambian
  validateWorkshopDates(index: number): void {
    const workshopForm = this.workshopsArray.at(index) as FormGroup

    // Forzar la validación del grupo completo
    workshopForm.updateValueAndValidity()
  }
}

