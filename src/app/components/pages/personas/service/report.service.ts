import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, Subject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class ReportService {
  private readonly baseUrl = "http://localhost:8080" // URL base centralizada

  reportActualizar = new Subject<any[]>()

  constructor(private http: HttpClient) { }

  // Método para obtener los reportes filtrados
  listReportsByFilter(trimester?: string, active?: string, year?: number, startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.baseUrl}/api/reports?`;
    const params = [];
    if (trimester) params.push(`trimester=${encodeURIComponent(trimester)}`);
    if (active) params.push(`active=${encodeURIComponent(active)}`);
    if (year) params.push(`year=${year}`);
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    url += params.join('&');
    return this.http.get<any[]>(url);
  }
  
  // Método para obtener un reporte por su ID
  getReportById(reportId: number): Observable<any> {
    const url = `${this.baseUrl}/api/reports/${reportId}`
    return this.http.get<any>(url)
  }

  // Método para obtener un reporte por ID con filtros de fecha opcionales
  getReportByIdWithDateFilter(reportId: number, startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.baseUrl}/api/reports/${reportId}/filtered?`;
    const params = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    url += params.join('&');
    return this.http.get<any>(url);
  }

  // Método Listado total
  getallReport(): Observable<any> {
    const url = `${this.baseUrl}/api/reports/all`
    return this.http.get<any>(url)
  }

  // Alias para compatibilidad con los componentes
  getReports(): Observable<any> {
    return this.getallReport()
  }

  // Insertar reporte
  newReport(newReport: any) {
    return this.http.post(`${this.baseUrl}/api/reports`, newReport)
  }

  // Alias para compatibilidad con los componentes
  createReport(report: any) {
    return this.newReport(report)
  }

  // Editar reporte
  updateReportById(reportId: number, updatedReport: any) {
    return this.http.put(`${this.baseUrl}/api/reports/${reportId}`, updatedReport)
  }

  // Alias para compatibilidad con los componentes
  updateReport(report: any) {
    return this.updateReportById(report.id, report)
  }

  // Eliminar Reporte Lógicamente
  disableReportById(reportId: number) {
    return this.http.delete(`${this.baseUrl}/api/reports/${reportId}`, {})
  }

  // Alias para compatibilidad con los componentes
  deleteReport(reportId: number) {
    return this.disableReportById(reportId)
  }

  // Activar Reporte
  activateReportById(reportId: number) {
    return this.http.put(`${this.baseUrl}/api/reports/restore/${reportId}`, {})
  }

  // Alias para compatibilidad con los componentes
  restoreReport(reportId: number) {
    return this.activateReportById(reportId)
  }

  // Método para descargar PDF (simulado)
  downloadReportPdf(reportId: number) {
    window.open(`${this.baseUrl}/api/reports/${reportId}/pdf`, "_blank")
  }
}