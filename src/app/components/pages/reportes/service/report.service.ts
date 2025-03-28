import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly baseUrl = 'http://localhost:8080'; // URL base centralizada
  reportActualizar = new Subject<any[]>();

  constructor(private http: HttpClient) {}

  
  // Método para obtener los reportes filtrados /OCULTA LAS IMAGENES ME LAS MUESTRA COMO NULL
  listReportsByFilter(trimester: string, active: string): Observable<any[]> {
    const url = `${this.baseUrl}/api/reports?trimester=${encodeURIComponent(trimester)}&active=${encodeURIComponent(active)}`;
    return this.http.get<any[]>(url);
  }

  // Método para obtener un reporte por su ID / ME LISTA CON LAS IMAGENES
  getReportById(reportId: number): Observable<any> {
    const url = `${this.baseUrl}/api/reports/${reportId}`;
    return this.http.get<any>(url);
  }
  // Método Listado total / ME LISTA CON LAS IMAGENES
  getallReport(): Observable<any> {
    const url = `${this.baseUrl}/api/reports/all`;
    return this.http.get<any>(url);
  }

  // Insertar reporte
  newReport(newReport: any) {
    return this.http.post(`${this.baseUrl}/api/reports`, newReport);
  }

  // Editar reporte
  updateReportById(reportId: number, updatedReport: any) {
    return this.http.put(`${this.baseUrl}/api/reports/${reportId}`, updatedReport);
  }

  // Eliminar Reporte Lógicamente
  disableReportById(reportId: number) {
    return this.http.delete(`${this.baseUrl}/api/reports/${reportId}`, {});
  }

  // Activar Reporte
  activateReportById(reportId: number) {
    return this.http.put(`${this.baseUrl}/api/reports/restore/${reportId}`, {});
  }
}
