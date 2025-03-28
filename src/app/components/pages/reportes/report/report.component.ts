import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../service/report.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  modalTitle: string = 'Nuevo Reporte Trimestral';
  searchYear: number | null = null;
  reports: any[] = [];
  filteredReports: any[] = [];
  selectedTrimester: string = 'Enero-Marzo';
  loading: boolean = false;
  isActive: boolean = true;
  isModalOpen = false;

  // Formulario reactivo
  reporteForm: FormGroup;
  trimestres = ['Enero-Marzo', 'Abril-Junio', 'Julio-Septiembre', 'Octubre-Diciembre'];
  imagenesTalleres: File[][] = [];
  cronograma: File | null = null;
  cronogramaError: string | null = null;
  isEditMode: boolean = false;
  currentReportId: number | null = null;

  constructor(private reportService: ReportService, private fb: FormBuilder) {
    this.reporteForm = this.fb.group({
      trimestre: ['', Validators.required],
      year: ['', [Validators.required]],
      descripcion: ['', Validators.required],
      talleres: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;
    this.reportService.listReportsByFilter(this.selectedTrimester, this.isActive ? 'A' : 'I').subscribe(
      (data: any[]) => {
        console.log('Datos recibidos del backend:', data);
        this.reports = data.sort((a, b) => b.report.id - a.report.id);
        this.filterReports();
        this.loading = false;
      },
      (error) => {
        console.error('Error al cargar los reportes:', error);
        this.loading = false;
      }
    );
  }

  onYearSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchYear = input.value ? parseInt(input.value) : null;
    this.filterReports();
  }

  filterReports() {
    this.filteredReports = this.reports.filter(report => {
      const matchesYear = this.searchYear ? report.report.year.toString().includes(this.searchYear.toString()) : true;
      const matchesStatus = report.report.active === (this.isActive ? 'A' : 'I');
      return matchesYear && matchesStatus;
    });
  }

  onFilterChange() {
    const trimesterSelect = document.getElementById('selectTrimester') as HTMLSelectElement;
    this.selectedTrimester = trimesterSelect.value;
    this.loadReports();
  }

  openModal(report?: any): void {
    this.isEditMode = !!report;
    this.currentReportId = report ? report.report.id : null;

    // Mostrar el Swal de carga
    Swal.fire({
      title: "Cargando datos...",
      text: "Por favor espera mientras se traen los datos del reporte.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    if (report) {
      // Cargar solo los datos básicos inicialmente
      this.setReportData(report); // Cargar datos básicos

      // Cargar detalles completos solo si se está editando
      if (this.isEditMode) {
        this.reportService.getReportById(this.currentReportId!).subscribe(
          (fullReport) => {
            this.setReportData(fullReport); // Cargar datos completos
            Swal.close(); // Cerrar el Swal de carga
            this.isModalOpen = true; // Abrir modal después de cargar los datos
          },
          (error) => {
            console.error('Error al cargar el reporte completo:', error);
            Swal.close(); // Cerrar el Swal de carga en caso de error
          }
        );
      } else {
        Swal.close(); // Cerrar el Swal de carga si no se está editando
        this.isModalOpen = true; // Abrir modal
      }
    } else {
      this.reporteForm.reset(); // Reiniciar el formulario si es un nuevo reporte
      Swal.close(); // Cerrar el Swal de carga
      this.isModalOpen = true; // Abrir modal
    }
  }


  closeModal(): void {
    this.isModalOpen = false; // Cerrar modal
    this.reporteForm.reset(); // Reiniciar formulario
    this.cronograma = null; // Limpiar archivo del cronograma
    this.cronogramaError = null; // Limpiar mensaje de error
    this.imagenesTalleres = []; // Reiniciar imágenes de talleres
    this.talleres.clear(); // Limpiar FormArray de talleres
    this.isEditMode = false; // Reiniciar estado de edición
    this.currentReportId = null; // Reiniciar ID del reporte actual

    const cronogramaInput = document.getElementById('cronograma') as HTMLInputElement;
    if (cronogramaInput) {
      cronogramaInput.value = ''; // Limpiar campo de entrada
    }
  }

  setReportData(report: any) {
    this.isEditMode = true; // Establece el modo de edición
    this.currentReportId = report.report.id;
    this.modalTitle = 'Editando Reporte Trimestral';

    // Mostrar los datos del reporte en la consola
    console.log('Datos del Reporte:', report);

    this.reporteForm.patchValue({
      trimestre: report.report.trimester,
      year: report.report.year,
      descripcion: report.report.description,
    });

    // Limpiar el FormArray y las imágenes antes de agregar los nuevos datos
    this.talleres.clear();
    this.imagenesTalleres = []; // Reiniciar el arreglo de imágenes

    report.workshop.forEach((detail: any) => {
      const tallerForm = this.fb.group({
        nombre: [detail.workshopName, Validators.required],
        descripcion: [detail.description],
        imagenes: [[]]
      });
      this.talleres.push(tallerForm);

      // Manejo de imágenes
      if (detail.imageUrl && Array.isArray(detail.imageUrl)) {
        const files = detail.imageUrl.map((imgBase64: string) => this.convertBase64ToFile(imgBase64));
        this.imagenesTalleres.push(files); // Almacenar los archivos convertidos

        // Cargar las imágenes en el formGroup
        if (files.length > 0) {
          tallerForm.get('imagenes')?.setValue(files);
        }
      } else {
        this.imagenesTalleres.push([]);
      }
    });

    // Manejo del cronograma
    if (report.report.schedule) {
      this.cronograma = this.convertBase64ToFile(report.report.schedule);
      console.log('Cronograma:', this.cronograma); // Mostrar el cronograma en la consola
    } else {
      this.cronograma = null; // Si no hay cronograma, establecer a null
    }

    // Mostrar las imágenes en la consola
    console.log('Imágenes del Taller:', this.imagenesTalleres);
  }

  delete(Id: number) {
    Swal.fire({
      title: '¿Estás seguro de eliminar el reporte?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, elimínalo!',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera mientras se elimina el reporte.',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
        });
        this.deleteReport(Id);
      }
    });
  }

  deleteReport(reportId: number) {
    this.reportService.disableReportById(reportId).subscribe(() => {
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Su reporte ha sido eliminado.',
        confirmButtonText: 'Aceptar'
      });
      this.loadReports();
    }, (error) => {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error al Eliminar',
        text: 'Hubo un error al eliminar el reporte. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    });
  }

  restore(Id: number) {
    Swal.fire({
      title: '¿Estás seguro de restaurar el reporte?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restauralo!',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Restaurando...',
          text: 'Por favor espera mientras se restaura el reporte.',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
        });
        this.restoreReport(Id);
      }
    });
  }

  restoreReport(reportId: number) {
    this.reportService.activateReportById(reportId).subscribe(() => {
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Restaurado!',
        text: 'Su reporte ha sido restaurado.',
        confirmButtonText: 'Aceptar'
      });
      this.loadReports();
    }, (error) => {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error al Restaurar',
        text: 'Hubo un error al restaurar el reporte. Inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    });
  }

  validarCronograma(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2 MB
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (!validImageTypes.includes(file.type)) {
        this.cronogramaError = 'El archivo debe ser una imagen (JPEG, PNG, GIF)';
        this.cronograma = null;
        input.value = '';
        Swal.fire({
          icon: 'error',
          title: 'Archivo Inválido',
          text: 'Por favor, selecciona una imagen válida (JPEG, PNG, GIF).',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo Demasiado Grande',
          text: 'El archivo debe ser menor de 2 MB.',
          confirmButtonText: 'Aceptar'
        });
        this.cronograma = null;
        input.value = '';
        return;
      }

      this.cronograma = file;
      this.cronogramaError = null;
    }
  }

  verCronograma(): void {
    if (this.cronograma) {
      const reader = new FileReader();
      reader.onload = (event) => {
        Swal.fire({
          title: "Vista Previa del Cronograma",
          imageUrl: event.target?.result as string,
          imageAlt: "Cronograma",
        });
      };
      reader.readAsDataURL(this.cronograma);
    }
  }

  get talleres(): FormArray {
    return this.reporteForm.get('talleres') as FormArray;
  }

  agregarTaller(): void {
    const tallerForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [null],
      imagenes: [[]]
    });
    this.talleres.push(tallerForm);
    this.imagenesTalleres.push([]);
  }

  eliminarTaller(index: number): void {
    this.talleres.removeAt(index);
    this.imagenesTalleres.splice(index, 1);
  }

  cargarImagenes(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo Inválido',
          text: 'Por favor, selecciona una imagen válida (JPEG, PNG, GIF).',
          confirmButtonText: 'Entendido'
        });
      } else {
        this.imagenesTalleres[index] = files;
        this.talleres.at(index).get('imagenes')?.setValue(this.imagenesTalleres[index]);
      }
    }
  }

  verImagenTaller(imagen: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      Swal.fire({
        title: imagen.name,
        imageUrl: event.target?.result as string,
        imageAlt: "Imagen del Taller",
      });
    };
    reader.readAsDataURL(imagen);
  }

  async guardarReporte(): Promise<void> {
    Swal.fire({
      title: "Guardando reporte...",
      text: "Por favor espera.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    if (this.reporteForm.valid) {
      const { year, trimestre, descripcion } = this.reporteForm.value;
      const workshopPromises = this.talleres.controls.map(taller => {
        const { nombre, descripcion: desc, imagenes } = taller.value;
        const imgPromises = imagenes.map((file: File) => this.convertToBase64(file));
        return Promise.all(imgPromises).then(imgBase64 => ({
          workshopName: nombre,
          description: desc,
          imageUrl: imgBase64
        }));
      });
      try {
        const workshop = await Promise.all(workshopPromises);
        const reporteData = {
          report: {
            year,
            trimester: trimestre,
            description: descripcion,
            schedule: this.cronograma ? await this.convertToBase64(this.cronograma) : null
          },
          workshop
        };

        if (this.isEditMode) {
          this.reportService.updateReportById(this.currentReportId!, reporteData).subscribe({
            next: () => {
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: 'Reporte Actualizado',
                text: 'El reporte se ha actualizado exitosamente.',
                confirmButtonText: 'Aceptar'
              });
              this.loadReports();
              this.closeModal();
            },
            error: (error) => {
              Swal.close();
              console.error('Error al actualizar el reporte:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error al Actualizar',
                text: 'Hubo un error al actualizar el reporte. Inténtalo de nuevo.',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        } else {
          this.reportService.newReport(reporteData).subscribe({
            next: () => {
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: 'Reporte Creado',
                text: 'El reporte se ha creado exitosamente.',
                confirmButtonText: 'Aceptar'
              });
              this.loadReports();
              this.closeModal();
            },
            error: (error) => {
              Swal.close();
              console.error('Error al crear el reporte:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error al Crear',
                text: 'Hubo un error al crear el reporte. Inténtalo de nuevo.',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        }
      } catch (error) {
        Swal.close();
        console.error('Error procesando los datos del reporte:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error Interno',
          text: 'Hubo un error al procesar los datos. Inténtalo de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Inválido',
        text: 'Por favor, completa todos los campos requeridos.',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          const base64String = reader.result.toString();
          resolve(base64String);
        } else {
          reject('No se pudo leer el archivo');
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  convertBase64ToFile(base64: string): File | null {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const byteString = atob(arr[1]);
    const ab = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ab[i] = byteString.charCodeAt(i);
    }
    return new File([ab], 'imagen.jpg', { type: mime || 'application/octet-stream' });
  }
  getTallerFormGroup(index: number): FormGroup {
    return this.talleres.at(index) as FormGroup;
  }
}
